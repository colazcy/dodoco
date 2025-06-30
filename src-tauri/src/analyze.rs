mod classify;
mod decode;
mod detect;
mod error;
mod event;

use classify::classify;
use decode::{decode, SampleType};
use detect::detect;
use error::Error;
use event::AnalyzeEvent;
use std::iter::repeat;
use tauri::{async_runtime::spawn_blocking, ipc::Channel, path::BaseDirectory, AppHandle, Manager};

pub type AnalyzeResult = Vec<(u64, u64, Vec<f32>)>;

#[tauri::command]
pub async fn analyze(
    path: String,
    batch_size: usize,
    pcm_threshold: f64,
    time_threshold: f64,
    enable_classify: bool,
    chan: Channel<AnalyzeEvent>,
    handle: AppHandle,
) -> Result<AnalyzeResult, Error> {
    let pcm_threshold = (10.0_f64).powf(pcm_threshold);
    spawn_blocking(move || {
        let decode_result = decode(&path, &chan)?;
        let detect_result = detect(
            &decode_result,
            batch_size,
            pcm_threshold as SampleType,
            time_threshold,
            &chan,
        )?;
        let res = if enable_classify {
            let model_path = handle
                .path()
                .resolve("model.onnx", BaseDirectory::Resource)?;
            let classify_result = classify(&decode_result, &detect_result, &model_path, &chan)?;
            detect_result
                .into_iter()
                .zip(classify_result.into_iter())
                .map(|((a, b), c)| (a, b, c))
                .collect()
        } else {
            detect_result
                .into_iter()
                .zip(repeat(Vec::new()))
                .map(|((a, b), c)| (a, b, c))
                .collect()
        };
        Ok(res)
    })
    .await?
}
