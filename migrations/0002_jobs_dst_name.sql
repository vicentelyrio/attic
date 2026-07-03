-- Destination top-level name, when it differs from the source's own name.
-- NULL means "same as the source name" (the common case). Used to duplicate a
-- file/folder into its own directory as "name copy.ext" without a rename step.
ALTER TABLE jobs ADD COLUMN dst_name TEXT;
