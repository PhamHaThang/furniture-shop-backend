const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const crypto = require("crypto");
const { sendMail } = require("../utils/sendMail");
// [POST] /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { email, password, fullName, phone } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError(400, "Email đã được sử dụng", "USER_EXISTS");
  }
  const user = await User.create({
    email,
    password,
    fullName,
    phone,
  });
  res.status(201).json({
    success: true,
    message: "Đăng ký thành công",
    user: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    },
    token: generateToken(user._id),
  });
});
// [GET] /api/auth/me
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    message: "Lấy thông tin user thành công",
    user: req.user,
  });
};
// [POST] /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(
      401,
      "Email hoặc mật khẩu không đúng",
      "INVALID_CREDENTIALS"
    );
  }
  
  // Kiểm tra tài khoản đã bị xóa
  if (user.isDeleted) {
    throw new AppError(
      403,
      "Tài khoản đã bị vô hiệu hóa",
      "ACCOUNT_DELETED"
    );
  }
  
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new AppError(
      401,
      "Email hoặc mật khẩu không đúng",
      "INVALID_CREDENTIALS"
    );
  }
  res.status(200).json({
    success: true,
    message: "Đăng nhập thành công",
    user: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    },
    token: generateToken(user._id),
  });
});
// [POST] /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError(400, "Vui lòng cung cấp email", "EMAIL_REQUIRED");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại", "USER_NOT_FOUND");
  }
  
  // Kiểm tra tài khoản đã bị xóa
  if (user.isDeleted) {
    throw new AppError(
      403,
      "Tài khoản đã bị vô hiệu hóa",
      "ACCOUNT_DELETED"
    );
  }
  
  try {
    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${
      process.env.FRONTEND_RESET_PASSWORD_URL ||
      "http://localhost:5173/reset-password"
    }/token=${resetToken}`;

    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
            body {
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              background-color: #f4f7f6;
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            }
            table,
            td,
            div,
            h1,
            p {
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            }
            .container {
              padding: 20px;
            }

            .wrapper {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
              overflow: hidden;
            }

            .header {
              background: #1262ec;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }

            .content {
              padding: 30px 40px;
              color: #333333;
              line-height: 1.6;
              font-size: 16px;
            }
            .content p {
              margin: 0 0 15px 0;
            }

            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 15px 35px;
              background-color: #3182ce;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .button:hover {
              background-color: #2b6cb0;
            }

            .link-box {
              background-color: #edf2f7;
              padding: 12px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              word-break: break-all;
              font-family: "Courier New", Courier, monospace;
              font-size: 14px;
            }

            .warning {
              background-color: #fefce8;
              border-left: 5px solid #fbbf24;
              padding: 20px;
              margin: 30px 0;
              font-size: 14px;
            }
            .warning strong {
              display: flex;
              align-items: center;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .warning ul {
              margin: 0;
              padding-left: 20px;
            }
            .warning li {
              margin-bottom: 5px;
            }
            .strong {
              font-weight: bold;
            }

            .footer {
              text-align: center;
              padding: 30px;
              font-size: 12px;
              color: #718096;
            }

            @media screen and (max-width: 600px) {
              .wrapper {
                width: 100% !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }
              .content {
                padding: 20px !important;
              }
            }
          </style>
    </head>
    <body>
      <table
            width="100%"
            border="0"
            cellspacing="0"
            cellpadding="0"
            class="container">
            <tr>
              <td align="center">
                <table border="0" cellspacing="0" cellpadding="0" class="wrapper">
                  <tr>
                    <td class="header">
                      <h1>Đặt Lại Mật Khẩu</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="content">
                      <p>Xin chào <strong>${user.fullName}</strong>,</p>
                      <p>
                        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản
                        của bạn tại <strong>Homi Shop</strong>.
                      </p>
                      <p>Để tiếp tục, vui lòng nhấp vào nút bên dưới:</p>

                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td class="button-container">
                            <a href="${resetUrl}" target="_blank" class="button"
                              >Đặt Lại Mật Khẩu</a
                            >
                          </td>
                        </tr>
                      </table>

                      <p>
                        Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên
                        kết sau vào trình duyệt:
                      </p>
                      <p class="link-box">${resetUrl}</p>

                      <div class="warning">
                        <strong>Lưu ý quan trọng</strong>
                        <ul>
                          <li>
                            Liên kết này sẽ hết hạn trong vòng
                            <span class="strong">10 phút</span>
                          </li>
                          <li>
                            Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email
                            này. Tài khoản của bạn vẫn an toàn.
                          </li>
                          <li>
                            Vì lý do bảo mật, không bao giờ chia sẻ liên kết này với
                            bất kỳ ai.
                          </li>
                        </ul>
                      </div>

                      <p>
                        Trân trọng,<br /><strong
                          >Đội ngũ Homi Shop</strong
                        >
                      </p>
                    </td>
                  </tr>
                </table>

                <table
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  style="max-width: 600px; width: 100%">
                  <tr>
                    <td class="footer">
                      <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                      <p>
                        &copy; 2025 Homi Shop. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
    </body>
    </html>`;
    await sendMail(user.email, "Đặt lại mật khẩu Homi Shop", html);
    res.status(200).json({
      success: true,
      message: "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError(
      500,
      "Không thể gửi email. Vui lòng thử lại sau",
      "EMAIL_SEND_ERROR"
    );
  }
});
// [POST] /api/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    throw new AppError(
      400,
      "Token và mật khẩu mới là bắt buộc",
      "TOKEN_PASSWORD_REQUIRED"
    );
  }
  if (newPassword.length < 6) {
    throw new AppError(
      400,
      "Mật khẩu mới phải có ít nhất 6 ký tự",
      "WEAK_PASSWORD"
    );
  }
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    throw new AppError(
      400,
      "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
      "INVALID_TOKEN"
    );
  }
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  const loginUrl =
    process.env.FRONTEND_LOGIN_URL || "http://localhost:5173/login";

  try {
    const html = `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="X-UA-Compatible" content="ie=edge" />
          <style>
            body {
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              background-color: #f4f7f6;
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            }
            table,
            td,
            div,
            h1,
            p {
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            }
            .container {
              padding: 20px;
            }

            .wrapper {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
              overflow: hidden;
            }

            .header {
              background: #1262ec;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: #ffffff;
              font-size: 28px;
              font-weight: 600;
            }

            .content {
              padding: 30px 40px;
              color: #333333;
              line-height: 1.6;
              font-size: 16px;
            }
            .content p {
              margin: 0 0 15px 0;
            }
            
            .success-box {
              text-align: center;
              padding: 20px 0;
            }
            .success-icon {
              width: 60px;
              height: 60px;
              background-color: #28a745;
              color: #ffffff;
              border-radius: 50%;
              line-height: 60px;
              font-size: 30px;
              font-weight: bold;
              margin: 0 auto 15px auto;
            }
            .success-box h2 {
              font-size: 22px;
              color: #28a745;
              margin: 0;
            }

            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 15px 35px;
              background-color: #3182ce;
              text-decoration: none;
              color: #ffffff !important;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .button:hover {
              background-color: #2b6cb0;
            }

            .security-note {
              background-color: #FFF9E6;
              border-left: 5px solid #FFC107;
              padding: 15px 20px;
              margin: 30px 0;
              font-size: 14px;
              line-height: 1.5;
            }

            .footer {
              text-align: center;
              padding: 30px;
              font-size: 12px;
              color: #718096;
            }

            @media screen and (max-width: 600px) {
              .wrapper {
                width: 100% !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }
              .content {
                padding: 20px !important;
              }
            }
          </style>
        </head>
        <body>
          <table
            width="100%"
            border="0"
            cellspacing="0"
            cellpadding="0"
            class="container">
            <tr>
              <td align="center">
                <table border="0" cellspacing="0" cellpadding="0" class="wrapper">
                  <tr>
                    <td class="header">
                      <h1>Đặt Lại Mật Khẩu Thành Công</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="content">
                      <div class="success-box">
                        <div class="success-icon">&#10003;</div>
                        <h2>Mật khẩu đã được cập nhật!</h2>
                      </div>

                      <p style="text-align: center;">Xin chào <strong>${user.fullName}</strong>,</p>
                      <p style="text-align: center;">
                        Mật khẩu cho tài khoản của bạn tại <strong>Homi Shop</strong> đã được đặt lại thành công.
                      </p>

                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td class="button-container">
                            <a href="${loginUrl}" target="_blank" class="button"
                              >Đăng Nhập Ngay</a
                            >
                          </td>
                        </tr>
                      </table>

                      <div class="security-note">
                        <strong>Lưu ý bảo mật:</strong> Nếu bạn không phải là người thực hiện thay đổi này, vui lòng liên hệ ngay với bộ phận hỗ trợ của chúng tôi để bảo vệ tài khoản của bạn.
                      </div>

                      <p>
                        Trân trọng,<br /><strong
                          >Đội ngũ Homi Shop</strong
                        >
                      </p>
                    </td>
                  </tr>
                </table>

                <table
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  style="max-width: 600px; width: 100%">
                  <tr>
                    <td class="footer">
                      <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                      <p>
                        &copy; 2025 Homi Shop. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    await sendMail(user.email, "Xác nhận đặt lại mật khẩu Homi Shop", html);
  } catch (emailError) {
    console.error("Failed to send confirmation email:", emailError);
  }

  res.status(200).json({
    success: true,
    message:
      "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.",
  });
});
