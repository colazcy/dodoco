use super::{error::Error, event::AnalyzeEvent};
use crate::utils::ProgressEmitter;
use std::fs::OpenOptions;
use symphonia::{
    core::{audio::SampleBuffer, io::MediaSourceStream, probe::Hint, units::Duration},
    default::{get_codecs, get_probe},
};
use tauri::ipc::Channel;

const REPORT_RATE: f64 = 0.01;

pub type SampleType = f32;

pub struct DecodeResult {
    pub samples: Vec<SampleType>,
    pub sample_rate: u32,
    pub num_channels: usize,
    pub num_frames: u64,
}

pub fn decode(path: &str, chan: &Channel<AnalyzeEvent>) -> Result<DecodeResult, Error> {
    let file = OpenOptions::new().read(true).open(path)?;
    let source = Box::new(file);
    let mss = MediaSourceStream::new(source, Default::default());
    let hint = Hint::new();
    let format_opts = Default::default();
    let metadata_opts = Default::default();
    let decoder_opts = Default::default();
    let probed = get_probe().format(&hint, mss, &format_opts, &metadata_opts)?;
    let mut format = probed.format;
    let track = format.default_track().ok_or(Error::MissingTrack)?;
    let mut decoder = get_codecs().make(&track.codec_params, &decoder_opts)?;

    let track_id = track.id;
    let len = track.codec_params.n_frames.ok_or(Error::MissingNFrames)?;

    let emit = |cur| {
        chan.send(AnalyzeEvent::DecodeProgress { cur }).unwrap();
    };
    let mut emitter = ProgressEmitter::new((len as f64 * REPORT_RATE) as u64, &emit);

    let mut samples = Vec::new();
    let mut spec = None;

    while let Ok(packet) = format.next_packet() {
        if packet.track_id() != track_id {
            continue;
        }
        match decoder.decode(&packet) {
            Ok(buf) => {
                let buf_spec = *buf.spec();
                if let Some(s) = spec {
                    if s != buf_spec {
                        return Err(Error::VariousSignalSpec);
                    }
                } else {
                    chan.send(AnalyzeEvent::Probed {
                        path: path.to_string(),
                        num_channels: buf.spec().channels.count(),
                        sample_rate: buf_spec.rate,
                        num_frames: len,
                    })
                    .unwrap();

                    let capacity = len * buf_spec.channels.count() as u64;
                    samples = Vec::with_capacity(capacity as usize);
                    spec = Some(buf_spec);
                }

                emitter.inc(buf.frames() as u64);

                let mut sample_buffer: SampleBuffer<SampleType> =
                    SampleBuffer::new(buf.capacity() as Duration, *buf.spec());
                sample_buffer.copy_interleaved_ref(buf);
                samples.extend(sample_buffer.samples());
            }
            Err(e) => return Err(e.into()),
        }
    }
    let channel_num = spec.map(|s| s.channels.count()).unwrap();
    chan.send(AnalyzeEvent::Decoded).unwrap();

    // The metadata may be inaccurate
    let num_frames = (samples.len() / channel_num) as u64;
    Ok(DecodeResult {
        samples,
        num_channels: channel_num,
        sample_rate: spec.unwrap().rate,
        num_frames,
    })
}
