export interface Video {
  id: string;
  title: string;
  filename: string;
  path: string;
  srtPath: string | null;
}

export interface Chapter {
  id: string;
  title: string;
  videos: Video[];
}

export async function scanCourseDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  courseId: string
): Promise<Chapter[]> {
  const chapters: Chapter[] = [];

  for await (const [name, handle] of (directoryHandle as any).entries()) {
    if (handle.kind === "directory") {
      const chapterName = name;
      const videos: Video[] = [];
      const srtFiles: string[] = [];
      const videoFiles: string[] = [];

      // Scan chapter directory
      for await (const [fileName, fileHandle] of handle.entries()) {
        if (fileHandle.kind === "file") {
          if (fileName.endsWith(".mp4")) {
            videoFiles.push(fileName);
          } else if (fileName.endsWith(".srt")) {
            srtFiles.push(fileName);
          }
        }
      }

      // Process videos
      for (const videoFile of videoFiles) {
        const cleanTitle = videoFile.replace(/^\d+\s/, "").replace(/\.mp4$/, "");
        const videoPath = `${chapterName}/${videoFile}`;
        const baseName = videoFile.replace(/\.mp4$/, "");
        const matchingSrt = srtFiles.find((f) => f.startsWith(baseName));
        const srtPath = matchingSrt ? `${chapterName}/${matchingSrt}` : null;

        // Video ID format: {courseId}::{relPath}
        const videoId = `${courseId}::${videoPath}`;

        videos.push({
          id: videoId,
          title: cleanTitle,
          filename: videoFile,
          path: videoPath,
          srtPath: srtPath,
        });
      }

      if (videos.length > 0) {
        // Sort videos by filename to maintain order
        videos.sort((a, b) =>
          a.filename.localeCompare(b.filename, undefined, { numeric: true })
        );

        chapters.push({
          id: chapterName,
          title: chapterName,
          videos,
        });
      }
    }
  }

  // Sort chapters by name
  chapters.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { numeric: true })
  );

  return chapters;
}

