use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum AnalyzeEvent {
    #[serde(rename_all = "camelCase")]
    Probed {
        path: String,
        num_channels: usize,
        sample_rate: u32,
        num_frames: u64,
    },
    DecodeProgress {
        cur: u64,
    },
    Decoded,
    DetectProgress {
        cur: u64,
    },
    Detected {
        num_clips: usize,
    },
    ClassifyProgress {
        cur: u64,
    },
    Classified,
}
