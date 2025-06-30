use crate::utils::ProgressEmitter;

use super::decode::DecodeResult;
use super::decode::SampleType;
use super::error::Result;
use super::event::AnalyzeEvent;
use itertools::Itertools;
use symphonia::core::units::Duration;
use tauri::ipc::Channel;

const REPORT_RATE: f64 = 0.01;

pub type DetectResult = Vec<(u64, u64)>;

pub fn detect(
    decode_result: &DecodeResult,
    batch_size: usize,
    pcm_threshold: SampleType,
    time_threshold: f64,
    chan: &Channel<AnalyzeEvent>,
) -> Result<DetectResult> {
    let DecodeResult {
        samples,
        sample_rate,
        num_channels: channel_num,
        num_frames: len,
    } = decode_result;
    let mut tmp = vec![0];
    let mut silence: Option<(u64, u64)> = None;
    let emit = |cur| {
        chan.send(AnalyzeEvent::DetectProgress { cur }).unwrap();
    };
    let mut emitter = ProgressEmitter::new((*len as f64 * REPORT_RATE) as u64, &emit);

    macro_rules! f {
        () => {
            if let Some((l, r)) = silence {
                if (r - l) as f64 > time_threshold * *sample_rate as f64 {
                    tmp.push(l);
                    tmp.push(r);
                }
            }
        };
    }

    samples
        .as_slice()
        .chunks_exact(batch_size * channel_num)
        .enumerate()
        .for_each(|(i, chunk)| {
            let l = (i * batch_size) as Duration;
            let r = l + batch_size as Duration;
            if chunk.iter().all(|x| x.abs() <= pcm_threshold) {
                if let Some(ref mut s) = silence {
                    s.1 = r;
                } else {
                    silence = Some((l, r));
                }
            } else {
                f!();
                silence = None;
            }
            emitter.inc(batch_size as u64);
        });

    f!();
    tmp.push(*len);
    chan.send(AnalyzeEvent::Detected {
        num_clips: tmp.len() / 2,
    })
    .unwrap();
    Ok(tmp.into_iter().tuples().collect())
}
