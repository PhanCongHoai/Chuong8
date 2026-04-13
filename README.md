# Đồ án lớn: Audio Database System bám trọn bài 1-5

Đây là đồ án full-stack hiện thực toàn bộ tinh thần của chuỗi bài tập cuối Chương 8:

- Bài 1: thiết kế **primitive function calls** cho audio retrieval
- Bài 2: xây dựng **AudioIndex** mở rộng từ `CreateAudioIndex`
- Bài 3: thiết kế và chạy được **AudioSQL**
- Bài 4: hiện thực **metadata indexing scheme**
- Bài 5: ghép tất cả thành **small audio database system**

## Công nghệ

- Frontend: React + Vite
- Backend: Node.js + Express
- Dữ liệu demo: JSON cục bộ + file WAV seed thật có thể chạy được

## Những gì dự án hiện có

### 1. Primitive functions

Hệ thống định nghĩa và công khai bộ primitive functions như:

- `AddAudioSource`
- `SegmentAudio`
- `ExtractAudioFeatures`
- `CreateAudioIndex`
- `SearchAudioByMetadata`
- `FindSimilarAudio`
- `ListAudioSegments`
- `ExecuteAudioSQL`

### 2. AudioIndex

Chỉ mục tổng hợp gồm 4 lớp:

- `AudioSource`
- `WindowVector`
- `VectorIndex`
- `MetadataIndex`

### 3. AudioSQL

Hỗ trợ một tập truy vấn rút gọn như:

```sql
SELECT * FROM audios;
SELECT title, category, priority FROM audios WHERE KEYWORD = 'cuoi';
SELECT * FROM audios WHERE CATEGORY = 'Bieu cam con nguoi';
SELECT * FROM audios WHERE SIMILAR_TO = 'audio-001' LIMIT 3;
SHOW PRIMITIVE FUNCTIONS;
SHOW AUDIO INDEX;
```

### 4. Metadata indexing scheme

Đã hiện thực inverted index cho:

- token từ title / description / notes
- tag
- category
- researcher
- collection

### 5. Small audio database system

Đã có:

- dashboard tổng quan
- kho âm thanh
- upload WAV
- phân tích tín hiệu
- truy vấn tương tự
- trang học thuật minh họa bài 1-5
- AudioSQL workbench

## Dữ liệu seed

Để dự án có thể chạy ngay, backend có script tạo file WAV seed trong `apps/backend/uploads`:

- tiếng cười nam mô phỏng
- tiếng cười nữ mô phỏng
- tiếng vỗ tay mô phỏng
- âm báo động mô phỏng
- âm nền hum mô phỏng
- motif piano mô phỏng
- giọng nam mô phỏng
- giọng nữ mô phỏng

Lưu ý:

- Đây là **dữ liệu seed tổng hợp** để demo chức năng.
- Nếu nộp học thuật mức cao hơn, bạn nên thay dần bằng **dữ liệu ghi âm thật** có nguồn và quyền sử dụng rõ ràng.

## Dữ liệu thật

Hệ thống đã hỗ trợ import dữ liệu thật từ:

- `dataset/real-audio/clap`
- `dataset/real-audio/drum`
- `dataset/real-audio/bell`

Định dạng hiện hỗ trợ:

- `.wav`
- `.mp3`

Lệnh import dữ liệu thật:

```powershell
npm.cmd run import:real --workspace backend
```

Lệnh này sẽ:

- quét 3 thư mục dữ liệu thật
- copy file vào `apps/backend/uploads`
- phân tích tín hiệu
- cập nhật lại `apps/backend/data/db.json`

## Cấu trúc thư mục

```text
apps/
  backend/
    data/
    scripts/
    src/
      routes/
      services/
      utils/
    uploads/
  frontend/
    src/
      api/
      components/
      pages/
```

## Cách chạy

### 1. Cài phụ thuộc

```powershell
npm.cmd install
```

### 2. Tạo dữ liệu seed WAV

```powershell
npm.cmd run seed --workspace backend
```

Hoặc nếu bạn muốn dùng dữ liệu thật:

```powershell
npm.cmd run import:real --workspace backend
```

### 3. Chạy backend

```powershell
npm.cmd run dev --workspace backend
```

Backend chạy tại `http://localhost:4000`

### 4. Chạy frontend

```powershell
npm.cmd run dev --workspace frontend
```

Frontend chạy tại `http://localhost:5173`

## API chính

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/audios`
- `POST /api/audios/upload`
- `POST /api/audios/:id/reanalyze`
- `GET /api/search/similar/:id`
- `GET /api/search/metadata`
- `GET /api/system/primitives`
- `GET /api/system/index`
- `GET /api/system/metadata-index`
- `GET /api/system/schema`
- `GET /api/system/coverage`
- `GET /api/system/audiosql/examples`
- `POST /api/audiosql/query`

## Kiểm tra nhanh

1. Mở tab `Bài 1-5` để xem primitive functions, schema và metadata index
2. Mở tab `AudioSQL` để chạy truy vấn mẫu
3. Mở tab `Tìm tương tự` để so sánh các file seed đã sinh
4. Upload thêm file WAV để mở rộng thư viện và kiểm tra lại chỉ mục
