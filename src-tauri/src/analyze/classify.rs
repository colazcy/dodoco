use crate::utils::ProgressEmitter;

use super::decode::{DecodeResult, SampleType};
use super::detect::DetectResult;
use super::error::Result;
use super::event::AnalyzeEvent;
use ort::{
    inputs,
    session::{builder::GraphOptimizationLevel, Session},
    value::Tensor,
};
use rubato::{FftFixedIn, Resampler};
use std::iter::repeat;
use std::path::Path;
use std::sync::OnceLock;
use tauri::ipc::Channel;

const MODEL_SAMPLE_RATE: usize = 16000;
const MODEL_INPUT_LEN: usize = 160000;
const MODEL_INPUT_TIME: f64 = MODEL_INPUT_LEN as f64 / MODEL_SAMPLE_RATE as f64;
type ModelDataType = f32;

fn to_mono(data: &[SampleType], num_channels: usize, num_frames: usize) -> Vec<SampleType> {
    let res = data
        .chunks_exact(num_channels)
        .map(|chunk| {
            let mut sum: f64 = 0.0;
            for x in chunk {
                sum += *x as f64;
            }
            (sum / num_channels as f64) as SampleType
        })
        .chain(repeat(0 as SampleType))
        .take(num_frames)
        .collect();
    res
}

fn resample(
    mut data: &[SampleType],
    sample_rate_in: usize,
    sample_rate_out: usize,
) -> Result<Vec<SampleType>> {
    const CHUNK_SIZE: usize = 4096;
    const SUB_CHUNKS: usize = 8;
    let mut resampler =
        FftFixedIn::<SampleType>::new(sample_rate_in, sample_rate_out, CHUNK_SIZE, SUB_CHUNKS, 1)
            .unwrap();
    let mut res = Vec::<SampleType>::new();
    let mut delay = resampler.output_delay();
    let mut append = |mut buf: &[SampleType]| {
        if buf.len() <= delay {
            delay -= buf.len()
        } else {
            buf = &buf[delay..];
            delay = 0;
            res.extend_from_slice(buf);
        }
    };

    loop {
        let l = resampler.input_frames_next();
        if data.len() < l {
            break;
        }
        let buf = resampler.process(&[&data[0..l]], None)?;
        append(buf[0].as_slice());
        data = &data[l..];
    }

    let buf = resampler.process_partial(Some(&[data]), None)?;
    append(buf[0].as_slice());

    let buf = resampler.process_partial::<&[SampleType]>(None, None)?;
    append(buf[0].as_slice());

    Ok(res)
}

static MODEL: OnceLock<Session> = OnceLock::new();

pub type ClassifyResult = Vec<Vec<f32>>;
pub fn classify(
    decode_result: &DecodeResult,
    detect_result: &DetectResult,
    model_path: &Path,
    chan: &Channel<AnalyzeEvent>,
) -> Result<ClassifyResult> {
    let model = match MODEL.get() {
        Some(model) => model,
        None => {
            let num_threads = num_cpus::get();
            let res = Session::builder()?
                .with_optimization_level(GraphOptimizationLevel::Disable)?
                .with_intra_threads(num_threads)?
                .commit_from_file(model_path)?;
            MODEL.set(res).unwrap();
            MODEL.get().unwrap()
        }
    };
    let num_frames = (MODEL_INPUT_TIME * decode_result.sample_rate as f64) as usize;
    let emit = |cur| {
        chan.send(AnalyzeEvent::ClassifyProgress { cur }).unwrap();
    };
    let mut emitter = ProgressEmitter::new(0, &emit);
    let mut res = Vec::with_capacity(detect_result.len());

    for (l, r) in detect_result {
        let mono = to_mono(
            &decode_result.samples[*l as usize * decode_result.num_channels
                ..*r as usize * decode_result.num_channels],
            decode_result.num_channels,
            num_frames,
        );
        let mut input = resample(
            mono.as_slice(),
            decode_result.sample_rate as usize,
            MODEL_SAMPLE_RATE,
        )?;

        input.resize_with(MODEL_INPUT_LEN, || 0 as ModelDataType);

        let tensor = Tensor::from_array(([1usize, 160000], input.into_boxed_slice()))?;
        let x = model.run(inputs![tensor]?)?;
        let v = &x[0];
        let v = v.try_extract_tensor::<ModelDataType>()?;
        emitter.inc(1);
        res.push(v.iter().cloned().collect());
    }

    chan.send(AnalyzeEvent::Classified).unwrap();
    Ok(res)
}
