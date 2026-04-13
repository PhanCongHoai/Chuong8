import { exportFeatureVectorCsv } from "../src/services/libraryService.js";

const csvPath = exportFeatureVectorCsv();
console.log(`Da cap nhat file CSV dac trung tai: ${csvPath}`);
