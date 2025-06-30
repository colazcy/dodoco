use error_serialize_derive::ErrorSerialize;
use tauri::ipc::Response;

#[derive(Debug, thiserror::Error, ErrorSerialize)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

#[tauri::command]
pub fn read_file(path: String) -> Result<Response, Error> {
    Ok(Response::new(std::fs::read(path)?))
}
