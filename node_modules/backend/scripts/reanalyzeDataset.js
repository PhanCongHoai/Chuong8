import { getDatabase, replaceDatabase } from "../src/services/libraryService.js";
import { analyzeAudioFile } from "../src/services/signalFeatureService.js";

async function main() {
  const db = getDatabase();
  const reanalyzedAudios = [];

  for (const audio of db.audios) {
    if (!audio.filePath) {
      reanalyzedAudios.push(audio);
      continue;
    }

    try {
      const analysis = await analyzeAudioFile(audio.filePath);
      reanalyzedAudios.push({
        ...audio,
        durationSeconds: analysis.durationSeconds,
        analysisStatus: "Đã phân tích lại",
        featureVector: analysis.featureVector,
        windows: analysis.windows,
        summary: analysis.summary,
      });
      console.log(`Đã phân tích lại: ${audio.title}`);
    } catch (error) {
      reanalyzedAudios.push({
        ...audio,
        analysisStatus: `Lỗi phân tích: ${error.message}`,
      });
      console.error(`Lỗi với ${audio.title}: ${error.message}`);
    }
  }

  replaceDatabase({
    ...db,
    audios: reanalyzedAudios,
  });

  console.log(`Hoàn tất phân tích lại ${reanalyzedAudios.length} bản ghi.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
