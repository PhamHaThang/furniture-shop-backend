# HOMI Shop — Backend

REST API cho cửa hàng nội thất HOMI Shop, chịu trách nhiệm xác thực, quản lý dữ liệu bán hàng, upload tài nguyên và kết nối dịch vụ gợi ý, phân tích dữ liệu Python.

## Chức năng

- Đăng ký, đăng nhập bằng JWT; quản lý hồ sơ, địa chỉ và khôi phục mật khẩu qua email.
- Quản lý sản phẩm, danh mục, thương hiệu, tồn kho và mã giảm giá.
- Xử lý giỏ hàng, danh sách yêu thích, đơn hàng và đánh giá sản phẩm.
- Phân quyền `user` và `admin`; quản trị người dùng, đơn hàng và trạng thái thanh toán.
- Upload ảnh và mô hình 3D lên Cloudinary.
- Cung cấp gợi ý content-based, collaborative, hybrid và sản phẩm tương tự qua dịch vụ Python.
- Tổng hợp phân tích đánh giá, phân cụm sản phẩm/người dùng và thống kê cho quản trị viên.

## Công nghệ

Node.js, Express 5, MongoDB/Mongoose 8, JWT, bcryptjs, Axios, Cloudinary, Multer, Nodemailer và Swagger UI.

## Cài đặt

Cần Node.js và npm, MongoDB cục bộ hoặc Atlas. Khi chạy cùng frontend trong dự án tổng, dùng Node.js `20.19+` thuộc nhánh 20 hoặc `22.12+` để đáp ứng yêu cầu Vite của frontend.

Có thể clone backend riêng:

```powershell
git clone https://github.com/PhamHaThang/furniture-shop-backend.git
cd furniture-shop-backend
```

Nếu đã clone dự án tổng, chỉ cần mở terminal trong thư mục `backend`. Tất cả lệnh tiếp theo chạy từ thư mục chứa `package.json` của backend.

```powershell
npm install
Copy-Item .env.example .env
```

### Cấu hình `.env`

Sửa file `.env` vừa sao chép theo môi trường của bạn. Cấu hình tối thiểu:

```dotenv
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/furniture_shop
JWT_SECRET=thay_bang_chuoi_bi_mat_cua_ban
JWT_EXPIRES_IN=7d
PYTHON_ML_SERVICE_URL=http://127.0.0.1:8001
```

| Biến | Ý nghĩa |
| --- | --- |
| `PORT` | Cổng HTTP, mặc định `5000` |
| `NODE_ENV` | Chế độ chạy; `production` ẩn stack trace trong phản hồi lỗi |
| `FRONTEND_URL` | Origin được CORS cho phép, mặc định `http://localhost:5173` |
| `MONGO_URI` | Chuỗi kết nối MongoDB; bắt buộc để khởi động API |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Khóa ký và thời hạn token, ví dụ `7d` |
| `PYTHON_ML_SERVICE_URL` | URL dịch vụ FastAPI, mặc định `http://127.0.0.1:8001` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cấu hình upload ảnh và mô hình 3D |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Cấu hình SMTP gửi email khôi phục mật khẩu |
| `ML_MAX_USERS` | Giới hạn dữ liệu người dùng gửi sang ML, mặc định `1500` |
| `ML_MAX_PRODUCTS` | Giới hạn sản phẩm gửi sang ML, mặc định `3000` |
| `ML_MAX_REVIEWS`, `ML_MAX_ORDERS` | Giới hạn đánh giá và đơn hàng gửi sang ML, mặc định mỗi loại `4000` |

File `.env.example` hiện dùng `ML_SERVICE_URL`, nhưng mã nguồn trong [services/mlService.js](services/mlService.js) đọc **`PYTHON_ML_SERVICE_URL`**. Đổi tên biến sau khi sao chép file mẫu. Các giá trị `quantity` của `ML_MAX_*` cần được thay bằng số nguyên dương hoặc bỏ để dùng mặc định.

Với Atlas, kiểm tra tài khoản database và danh sách IP được phép truy cập. Với Gmail SMTP, cấu hình `EMAIL_PASSWORD` bằng mật khẩu ứng dụng phù hợp.

### Khởi động

```powershell
npm run dev
```

API chạy tại http://localhost:5000, chỉ bắt đầu lắng nghe sau khi kết nối MongoDB thành công. `npm start` chạy trực tiếp bằng Node.js, không tự khởi động lại khi sửa mã.

Khởi động dịch vụ Python tại cổng `8001` để sử dụng các tính năng gợi ý và phân tích. Backend gửi dữ liệu từ MongoDB sang Python qua HTTP, thời gian chờ mỗi lời gọi ML hiện là 10 giây.

## API

Tài liệu Swagger có tại http://localhost:5000/api-docs. Các nhóm API có tiền tố `/api`:

| Đường dẫn | Chức năng |
| --- | --- |
| `/api/auth` | Đăng ký, đăng nhập, khôi phục mật khẩu và thông tin xác thực |
| `/api/users` | Hồ sơ, mật khẩu và địa chỉ người dùng |
| `/api/products`, `/api/categories`, `/api/brands` | Danh mục hàng hóa |
| `/api/cart`, `/api/wishlist` | Giỏ hàng và danh sách yêu thích |
| `/api/orders` | Đặt hàng và theo dõi đơn hàng |
| `/api/reviews`, `/api/promotions` | Đánh giá và khuyến mãi |
| `/api/upload` | Upload, xóa tài nguyên Cloudinary; yêu cầu quyền admin |
| `/api/recommendations` | Gợi ý sản phẩm và kiểm tra dịch vụ ML |
| `/api/admin` | Quản trị và phân tích; yêu cầu quyền admin |

API được bảo vệ nhận token qua header:

```http
Authorization: Bearer <token_nhan_duoc_khi_dang_nhap>
```

### Endpoint gợi ý và phân tích

| Phương thức | Đường dẫn | Quyền |
| --- | --- | --- |
| GET | `/api/recommendations/health` | Công khai |
| GET | `/api/recommendations/product/:productId/similar` | Công khai |
| GET | `/api/recommendations/me/content-based` | Đăng nhập |
| GET | `/api/recommendations/me/collaborative` | Đăng nhập |
| GET | `/api/recommendations/me/hybrid` | Đăng nhập |
| GET | `/api/admin/ml/sentiment` | Admin |
| GET | `/api/admin/ml/clusters` | Admin |
| GET | `/api/admin/ml/dashboard` | Admin |

Các endpoint gợi ý nhận query `limit`, mặc định `8`. Endpoint phân cụm nhận `clusterType=products` hoặc `users` và `clusters`, mặc định `4`. Các endpoint phân tích quản trị nhận thêm `startDate`, `endDate` để lọc dữ liệu theo thời gian.

### Upload

Gửi dữ liệu bằng `multipart/form-data`, kèm token của admin:

| Endpoint POST | Tên trường | Giới hạn trong middleware |
| --- | --- | --- |
| `/api/upload/image` | `image` | Một ảnh, tối đa 5 MB |
| `/api/upload/images` | `images` | Tối đa 10 ảnh, mỗi ảnh 5 MB |
| `/api/upload/3d-model` | `model3D` | Một mô hình, tối đa 10 MB |

Ảnh hỗ trợ JPG, JPEG, PNG, WebP. Middleware cho phép GLTF, GLB, OBJ, FBX cho mô hình; khả năng hiển thị trên frontend còn phụ thuộc định dạng mà Model Viewer hỗ trợ.

## Tạo quản trị viên và dữ liệu mẫu

Tài khoản đăng ký qua `/api/auth/register` mặc định có `role: "user"`. Trong môi trường phát triển, đăng ký tài khoản đầu tiên rồi dùng MongoDB Compass hoặc mongosh cập nhật `role` của đúng tài khoản trong collection `users` thành `"admin"`. Đăng nhập lại để sử dụng giao diện `/admin` của frontend.

Tạo danh mục, thương hiệu và sản phẩm trước khi chạy script seed. Script sẽ ghi thêm người dùng, đơn hàng, đánh giá và cập nhật thống kê sản phẩm, nên chạy trên database phát triển:

```powershell
npm run seed:ml-data
npm run check:review-eligibility
```

Xem tham số seed và quy trình kiểm tra dữ liệu trong [hướng dẫn seed ML](scripts/SEED_SCRIPT_GUIDE.md).

## Các lệnh hỗ trợ

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy API với nodemon |
| `npm start` | Chạy `node server.js` |
| `npm run seed:ml-data` | Tạo thêm dữ liệu mẫu từ sản phẩm hiện có |
| `npm run check:review-eligibility` | Tìm đánh giá không có đơn hàng đã giao và đã thanh toán tương ứng |
| `npm run cleanup:invalid-reviews` | Xem trước các đánh giá không hợp lệ cần xóa |
| `npm run cleanup:invalid-reviews -- --apply` | Thực sự xóa đánh giá không hợp lệ |
| `npm run recalc:product-review-stats` | Tính lại `averageRating` và `totalReviews` |

Lệnh cleanup có `--apply` xóa dữ liệu thật. Kiểm tra kết quả xem trước và sao lưu dữ liệu cần giữ trước khi dùng. Backend chưa có bộ kiểm thử tự động; `npm test` hiện là lệnh mẫu trả về lỗi.

## Cấu trúc mã nguồn

```text
backend/
├── configs/          # MongoDB, Cloudinary, Swagger
├── controllers/      # Nghiệp vụ của các API
├── docs/             # Khai báo tài liệu Swagger
├── middlewares/      # JWT, phân quyền, upload và xử lý lỗi
├── models/           # Mongoose schemas
├── routes/           # Định tuyến công khai, người dùng và admin
├── scripts/          # Seed và bảo trì dữ liệu đánh giá
├── services/         # HTTP client gọi dịch vụ Python
├── utils/            # JWT, email, chuẩn bị dữ liệu ML và tiện ích
└── server.js         # Khởi tạo Express và kết nối database
```

## Kiểm tra và xử lý lỗi

```powershell
Invoke-RestMethod http://localhost:5000/
Invoke-RestMethod http://localhost:5000/api/recommendations/health
```

Endpoint đầu trả về `API is running...`. Với endpoint ML, kiểm tra `healthStatus.status`: `ok` nghĩa là Python phản hồi bình thường, `down` nghĩa là kết nối thất bại. Endpoint này hiện vẫn trả HTTP thành công khi dịch vụ ML không hoạt động.

| Lỗi | Cách kiểm tra |
| --- | --- |
| Backend thoát khi khởi động | Kiểm tra `MONGO_URI`, trạng thái MongoDB và quyền truy cập Atlas |
| CORS chặn frontend | Đặt `FRONTEND_URL` trùng origin thực tế của frontend |
| HTTP 401/403 | Kiểm tra bearer token, hạn token, trạng thái và quyền của tài khoản |
| ML không kết nối hoặc hết thời gian chờ | Kiểm tra `PYTHON_ML_SERVICE_URL`, tiến trình Uvicorn và lượng dữ liệu gửi đi |
| Upload hoặc gửi email thất bại | Kiểm tra cấu hình Cloudinary/SMTP tương ứng |

Không commit `.env` hoặc khóa bí mật. Thông tin kết nối phải được cấu hình riêng cho từng môi trường.
