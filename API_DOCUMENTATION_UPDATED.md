# Homi Shop API Documentation

Base URL: `http://localhost:5000/api`

## Authentication (`/auth`)
- **POST** `/register`: Đăng ký tài khoản mới.
- **POST** `/login`: Đăng nhập.
- **GET** `/profile`: Lấy thông tin user hiện tại (Yêu cầu Token).

## Products (`/products`)
- **GET** `/`: Lấy danh sách sản phẩm (có filter).
- **GET** `/featured`: Sản phẩm nổi bật.
- **GET** `/new-arrivals`: Sản phẩm mới.
- **GET** `/best-sellers`: Sản phẩm bán chạy.
- **GET** `/:slug`: Chi tiết sản phẩm.
- **GET** `/related/:productId`: Sản phẩm liên quan.

## Categories (`/categories`)
- **GET** `/`: Lấy tất cả danh mục.
- **GET** `/:slug`: Lấy chi tiết danh mục và sản phẩm thuộc danh mục.

## Brands (`/brands`)
- **GET** `/`: Lấy tất cả thương hiệu.
- **GET** `/:slug`: Lấy chi tiết thương hiệu.

## Cart (`/cart`) - Yêu cầu Token
- **GET** `/`: Lấy giỏ hàng hiện tại.
- **POST** `/add`: Thêm sản phẩm vào giỏ.
- **PUT** `/update`: Cập nhật số lượng.
- **DELETE** `/remove/:productId`: Xóa sản phẩm khỏi giỏ.
- **DELETE** `/clear`: Xóa sạch giỏ hàng.

## Orders (`/orders`)
- **POST** `/` (Token): Tạo đơn hàng mới.
  - Body: `{ shippingAddress, paymentMethod: "COD", ... }`
- **GET** `/` (Token): Lấy danh sách đơn hàng của tôi.
- **GET** `/:id` (Token): Chi tiết đơn hàng.
- **PUT** `/:id/cancel` (Token): Hủy đơn hàng (chỉ khi pending/processing).
- **GET** `/code/:code`: Tra cứu đơn hàng (Public).

## Reviews (`/reviews`)
- **POST** `/`: Thêm đánh giá (Token).
- **GET** `/product/:productId`: Lấy đánh giá của sản phẩm.

## Wishlist (`/wishlist`) - Yêu cầu Token
- **GET** `/`: Lấy danh sách yêu thích.
- **POST** `/toggle`: Thêm/Xóa sản phẩm khỏi wishlist.

## Admin (`/admin`) - Yêu cầu Token (Role: admin)
- **Users**: Quản lý người dùng.
- **Products**: CRUD sản phẩm.
- **Categories**: CRUD danh mục.
- **Brands**: CRUD thương hiệu.
- **Orders**: Quản lý đơn hàng, cập nhật trạng thái.
- **Promotions**: Quản lý mã giảm giá.
