use serde::{Deserialize, Serialize};

pub use crate::util::now;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Op {
    Copy,
    Move,
}

impl Op {
    pub fn as_str(self) -> &'static str {
        match self {
            Op::Copy => "copy",
            Op::Move => "move",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "copy" => Some(Op::Copy),
            "move" => Some(Op::Move),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Status {
    Planning,
    NeedsResolution,
    Queued,
    Running,
    Done,
    Failed,
    Canceled,
}

impl Status {
    pub fn as_str(self) -> &'static str {
        match self {
            Status::Planning => "planning",
            Status::NeedsResolution => "needs_resolution",
            Status::Queued => "queued",
            Status::Running => "running",
            Status::Done => "done",
            Status::Failed => "failed",
            Status::Canceled => "canceled",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "planning" => Some(Status::Planning),
            "needs_resolution" => Some(Status::NeedsResolution),
            "queued" => Some(Status::Queued),
            "running" => Some(Status::Running),
            "done" => Some(Status::Done),
            "failed" => Some(Status::Failed),
            "canceled" => Some(Status::Canceled),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Resolution {
    Overwrite,
    Skip,
}

impl Resolution {
    pub fn as_str(self) -> &'static str {
        match self {
            Resolution::Overwrite => "overwrite",
            Resolution::Skip => "skip",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "overwrite" => Some(Resolution::Overwrite),
            "skip" => Some(Resolution::Skip),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Policy {
    OverwriteAll,
    SkipAll,
}

impl Policy {
    pub fn as_str(self) -> &'static str {
        match self {
            Policy::OverwriteAll => "overwrite_all",
            Policy::SkipAll => "skip_all",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "overwrite_all" => Some(Policy::OverwriteAll),
            "skip_all" => Some(Policy::SkipAll),
            _ => None,
        }
    }

    pub fn resolution(self) -> Resolution {
        match self {
            Policy::OverwriteAll => Resolution::Overwrite,
            Policy::SkipAll => Resolution::Skip,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Job {
    pub id: String,
    pub user_id: Option<String>,
    pub op: Op,
    pub src_root: String,
    pub src_path: String,
    pub dst_root: String,
    pub dst_dir: String,
    pub dst_name: Option<String>,
    pub status: Status,
    pub policy: Option<Policy>,
    pub bytes_total: i64,
    pub bytes_done: i64,
    pub current_file: Option<String>,
    pub error: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct JobFile {
    pub rel_path: String,
    pub size: i64,
    pub bytes_done: i64,
    pub conflict: bool,
    pub resolution: Option<Resolution>,
    pub done: bool,
}
