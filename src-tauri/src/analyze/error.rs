use error_serialize_derive::ErrorSerialize;

#[derive(Debug, thiserror::Error, ErrorSerialize)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Symphonia(#[from] symphonia::core::errors::Error),

    #[error(transparent)]
    Ort(#[from] ort::error::Error),

    #[error(transparent)]
    Tauri(#[from] tauri::Error),

    #[error(transparent)]
    Resample(#[from] rubato::ResampleError),

    #[error("Missing track")]
    MissingTrack,

    #[error("Missing n_frames")]
    MissingNFrames,

    #[error("Various signal spec")]
    VariousSignalSpec,
}

pub type Result<T> = std::result::Result<T, Error>;
