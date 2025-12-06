/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng ký tài khoản mới
 *     description: Tạo tài khoản người dùng mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "0123456789"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đăng ký thành công
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email đã tồn tại
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập
 *     description: Đăng nhập vào hệ thống
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Lấy thông tin user hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Quên mật khẩu
 *     description: Gửi email reset mật khẩu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email đã được gửi
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Đặt lại mật khẩu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token nhận được từ email
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 */

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Lấy danh sách sản phẩm
 *     description: Lấy danh sách sản phẩm với filter, search, pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID hoặc slug
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Brand ID hoặc slug
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: price
 *         description: Sort field (e.g. price, -createdAt)
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /products/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Lấy sản phẩm theo slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: modern-sofa
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Lấy giỏ hàng
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Xóa toàn bộ giỏ hàng
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Thêm thành công
 *       400:
 *         description: Sản phẩm không tồn tại hoặc hết hàng
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /cart/items/{productId}:
 *   put:
 *     tags: [Cart]
 *     summary: Cập nhật số lượng sản phẩm trong giỏ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Cart]
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /cart/discount:
 *   post:
 *     tags: [Cart]
 *     summary: Áp dụng mã giảm giá
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE10
 *     responses:
 *       200:
 *         description: Áp dụng thành công
 *   delete:
 *     tags: [Cart]
 *     summary: Xóa mã giảm giá
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy danh sách đơn hàng của user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipping, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     tags: [Orders]
 *     summary: Tạo đơn hàng
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - payment
 *             properties:
 *               shippingAddress:
 *                 $ref: '#/components/schemas/Address'
 *               payment:
 *                 type: object
 *                 properties:
 *                   method:
 *                     type: string
 *                     enum: [cod, bank_transfer, momo, vnpay]
 *                     example: cod
 *               shippingFee:
 *                 type: number
 *                 example: 30000
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Giỏ hàng trống hoặc thiếu thông tin
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /orders/code/{code}:
 *   get:
 *     tags: [Orders]
 *     summary: Tra cứu đơn hàng bằng mã
 *     description: Endpoint công khai để tra cứu đơn hàng
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: FS123456ABC
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Không tìm thấy đơn hàng
 */



/**
 * @swagger
 * /upload/image:
 *   post:
 *     tags: [Upload]
 *     summary: Upload single image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpg, jpeg, png, webp - max 5MB)
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     publicId:
 *                       type: string
 *                     format:
 *                       type: string
 *                     width:
 *                       type: number
 *                     height:
 *                       type: number
 *                     size:
 *                       type: number
 *       400:
 *         description: File không hợp lệ
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /upload/3d-model:
 *   post:
 *     tags: [Upload]
 *     summary: Upload 3D model
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - model3D
 *             properties:
 *               model3D:
 *                 type: string
 *                 format: binary
 *                 description: 3D model file (glb, gltf, obj, fbx - max 50MB)
 *     responses:
 *       200:
 *         description: Upload thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Lấy thông tin profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *   put:
 *     tags: [Users]
 *     summary: Cập nhật profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload avatar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */

/**
 * @swagger
 * /users/me/password:
 *   put:
 *     tags: [Users]
 *     summary: Đổi mật khẩu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */

/**
 * @swagger
 * /users/me/address:
 *   get:
 *     tags: [Users]
 *     summary: Lấy danh sách địa chỉ
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     tags: [Users]
 *     summary: Thêm địa chỉ mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Thêm địa chỉ thành công
 */

/**
 * @swagger
 * /users/me/address/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Cập nhật địa chỉ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Users]
 *     summary: Xóa địa chỉ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /products/featured:
 *   get:
 *     tags: [Products]
 *     summary: Lấy sản phẩm nổi bật
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /products/new-arrivals:
 *   get:
 *     tags: [Products]
 *     summary: Lấy sản phẩm mới
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /products/best-sellers:
 *   get:
 *     tags: [Products]
 *     summary: Lấy sản phẩm bán chạy
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /products/related/{productId}:
 *   get:
 *     tags: [Products]
 *     summary: Lấy sản phẩm liên quan
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Lấy tất cả danh mục
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     tags: [Categories]
 *     summary: Lấy cây danh mục
 *     description: Lấy danh mục theo cấu trúc hierarchical
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /categories/{slug}:
 *   get:
 *     tags: [Categories]
 *     summary: Lấy danh mục theo slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /brands:
 *   get:
 *     tags: [Brands]
 *     summary: Lấy tất cả thương hiệu
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 brands:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Brand'
 */

/**
 * @swagger
 * /brands/popular:
 *   get:
 *     tags: [Brands]
 *     summary: Lấy thương hiệu phổ biến
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /brands/{slug}:
 *   get:
 *     tags: [Brands]
 *     summary: Lấy thương hiệu theo slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /cart/discount:
 *   post:
 *     tags: [Cart]
 *     summary: Áp dụng mã giảm giá
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE10
 *     responses:
 *       200:
 *         description: Áp dụng thành công
 *   delete:
 *     tags: [Cart]
 *     summary: Xóa mã giảm giá
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy chi tiết đơn hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     tags: [Orders]
 *     summary: Hủy đơn hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công
 */

/**
 * @swagger
 * /orders/{id}/payment:
 *   put:
 *     tags: [Orders]
 *     summary: Xác nhận thanh toán đơn hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *                 description: Mã giao dịch thanh toán
 *               paymentProof:
 *                 type: string
 *                 description: URL ảnh chứng minh thanh toán
 *     responses:
 *       200:
 *         description: Xác nhận thanh toán thành công
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy chi tiết đơn hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Không tìm thấy đơn hàng
 */

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Lấy đánh giá của sản phẩm
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                     totalReviews:
 *                       type: number
 *                     ratingDistribution:
 *                       type: object
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Tạo đánh giá sản phẩm
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - rating
 *               - comment
 *             properties:
 *               product:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo đánh giá thành công
 *       403:
 *         description: Chưa mua sản phẩm này
 */

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Cập nhật đánh giá
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Reviews]
 *     summary: Xóa đánh giá
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Lấy danh sách yêu thích
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 wishlist:
 *                   $ref: '#/components/schemas/Wishlist'
 *   delete:
 *     tags: [Wishlist]
 *     summary: Xóa toàn bộ wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /wishlist/{productId}:
 *   post:
 *     tags: [Wishlist]
 *     summary: Thêm sản phẩm vào wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thêm thành công
 *   delete:
 *     tags: [Wishlist]
 *     summary: Xóa sản phẩm khỏi wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /promotions:
 *   get:
 *     tags: [Promotions]
 *     summary: Lấy tất cả khuyến mãi đang active
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 promotions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Promotion'
 */

/**
 * @swagger
 * /promotions/validate:
 *   post:
 *     tags: [Promotions]
 *     summary: Validate mã khuyến mãi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - orderTotal
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE10
 *               orderTotal:
 *                 type: number
 *                 example: 5000000
 *     responses:
 *       200:
 *         description: Mã hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 promotion:
 *                   $ref: '#/components/schemas/Promotion'
 *                 discountAmount:
 *                   type: number
 *                 finalAmount:
 *                   type: number
 *       400:
 *         description: Mã không hợp lệ
 */

/**
 * @swagger
 * /upload/images:
 *   post:
 *     tags: [Upload]
 *     summary: Upload multiple images
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Upload thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /upload/delete:
 *   delete:
 *     tags: [Upload]
 *     summary: Xóa file từ Cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicId
 *             properties:
 *               publicId:
 *                 type: string
 *               resourceType:
 *                 type: string
 *                 enum: [image, raw]
 *                 default: image
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /upload/delete-multiple:
 *   delete:
 *     tags: [Upload]
 *     summary: Xóa nhiều file từ Cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicIds
 *             properties:
 *               publicIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               resourceType:
 *                 type: string
 *                 enum: [image, raw]
 *                 default: image
 *     responses:
 *       200:
 *         description: Xóa thành công
 */



/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Lấy danh sách users (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *     responses:
 *       200:
 *         description: Thành công
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     tags: [Admin - Users]
 *     summary: Tạo user mới (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: Tạo user thành công
 */

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Lấy user theo ID (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *   put:
 *     tags: [Admin - Users]
 *     summary: Cập nhật user (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Admin - Users]
 *     summary: Xóa user (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /admin/products:
 *   get:
 *     tags: [Admin - Products]
 *     summary: Lấy tất cả sản phẩm (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     tags: [Admin - Products]
 *     summary: Tạo sản phẩm mới (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sku
 *               - price
 *               - category
 *               - brand
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 example: Modern Sofa
 *               sku:
 *                 type: string
 *                 example: SOFA-001
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 example: 5000000
 *               category:
 *                 type: string
 *                 description: Category ID
 *               brand:
 *                 type: string
 *                 description: Brand ID
 *               stock:
 *                 type: number
 *                 example: 10
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               model3DUrl:
 *                 type: string
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *               materials:
 *                 type: array
 *                 items:
 *                   type: string
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   width:
 *                     type: number
 *                   height:
 *                     type: number
 *                   length:
 *                     type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /admin/products/{id}:
 *   get:
 *     tags: [Admin - Products]
 *     summary: Lấy sản phẩm theo ID (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *   put:
 *     tags: [Admin - Products]
 *     summary: Cập nhật sản phẩm (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Admin - Products]
 *     summary: Xóa sản phẩm (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     tags: [Admin - Categories]
 *     summary: Lấy tất cả danh mục (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     tags: [Admin - Categories]
 *     summary: Tạo danh mục mới (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentCategory:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     tags: [Admin - Categories]
 *     summary: Cập nhật danh mục (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Admin - Categories]
 *     summary: Xóa danh mục (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /admin/brands:
 *   get:
 *     tags: [Admin - Brands]
 *     summary: Lấy tất cả thương hiệu (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     tags: [Admin - Brands]
 *     summary: Tạo thương hiệu mới (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */

/**
 * @swagger
 * /admin/brands/{id}:
 *   put:
 *     tags: [Admin - Brands]
 *     summary: Cập nhật thương hiệu (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Admin - Brands]
 *     summary: Xóa thương hiệu (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     tags: [Admin - Orders]
 *     summary: Lấy tất cả đơn hàng (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /admin/orders/stats:
 *   get:
 *     tags: [Admin - Orders]
 *     summary: Thống kê đơn hàng (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: number
 *                     totalRevenue:
 *                       type: number
 *                     averageOrderValue:
 *                       type: number
 *                     statusBreakdown:
 *                       type: object
 */

/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     tags: [Admin - Orders]
 *     summary: Lấy đơn hàng theo ID (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *   delete:
 *     tags: [Admin - Orders]
 *     summary: Xóa đơn hàng (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   put:
 *     tags: [Admin - Orders]
 *     summary: Cập nhật trạng thái đơn hàng (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */

/**
 * @swagger
 * /admin/orders/{id}/payment-status:
 *   put:
 *     tags: [Admin - Orders]
 *     summary: Cập nhật trạng thái thanh toán (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed]
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */

/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     tags: [Admin - Reviews]
 *     summary: Lấy tất cả đánh giá (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */

/**
 * @swagger
 * /admin/reviews/{id}:
 *   delete:
 *     tags: [Admin - Reviews]
 *     summary: Xóa đánh giá (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /admin/promotions:
 *   get:
 *     tags: [Admin - Promotions]
 *     summary: Lấy tất cả khuyến mãi (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     tags: [Admin - Promotions]
 *     summary: Tạo khuyến mãi mới (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *               - startDate
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               minSpend:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tạo thành công
 */

/**
 * @swagger
 * /admin/promotions/{id}:
 *   get:
 *     tags: [Admin - Promotions]
 *     summary: Lấy khuyến mãi theo ID (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *   put:
 *     tags: [Admin - Promotions]
 *     summary: Cập nhật khuyến mãi (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Admin - Promotions]
 *     summary: Xóa khuyến mãi (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
