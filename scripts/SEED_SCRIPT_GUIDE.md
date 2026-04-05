# Huong Dan Chay Script Seed Du Lieu ML

Tai lieu nay huong dan day du cach seed du lieu lon cho he thong ML Analytics, bao gom:

- Tao du lieu users/orders/reviews
- Kiem tra rule review hop le
- Dọn review vi pham (neu co)
- Dong bo lai thong ke review tren product

## 1) Dieu kien truoc khi chay

1. Da tao file `.env` trong backend va co `MONGO_URI` hop le.
2. Da cai dependencies:

```bash
cd backend
npm install
```

3. DB da co `products` (seed script can product de tao order/review).

## 2) Cac script dang co

Trong `package.json`, cac script phuc vu seed gom:

- `npm run seed:ml-data`
- `npm run check:review-eligibility`
- `npm run cleanup:invalid-reviews`
- `npm run recalc:product-review-stats`

## 3) Chay seed co ban

Lenh mac dinh:

```bash
npm run seed:ml-data
```

Script se:

- Dam bao co du user thuong (tu tao them neu thieu)
- Tao orders ngau nhien cho users
- Tao reviews tu orders hop le
- Tu dong cap nhat `soldCount`, `totalReviews`, `averageRating` cho products

## 4) Chay seed so luong lon

Cau hinh tham so:

- `--minUsers`: so user toi thieu can co
- `--minOrders`: so order toi thieu/user
- `--maxOrders`: so order toi da/user
- `--days`: du lieu trai deu trong N ngay gan nhat

Vi du seed lon:

```bash
npm run seed:ml-data -- --minUsers=300 --minOrders=15 --maxOrders=30 --days=365
```

Vi du seed sieu lon:

```bash
npm run seed:ml-data -- --minUsers=500 --minOrders=20 --maxOrders=40 --days=365
```

## 5) Rule quan trong cho review

He thong chi cho review duoc tao tu don hang:

- `status = delivered`
- `payment.status = completed`

Neu du lieu cu co sai rule, dung 2 buoc ben duoi de kiem tra va cleanup.

## 6) Kiem tra review vi pham rule

```bash
npm run check:review-eligibility
```

Ket qua tra ve dang JSON:

```json
{
    "invalidReviewCount": 0
}
```

## 7) Cleanup review vi pham

### 7.1 Dry run (khong xoa)

```bash
npm run cleanup:invalid-reviews
```

### 7.2 Apply (xoa that)

```bash
npm run cleanup:invalid-reviews -- --apply
```

## 8) Dong bo lai thong ke review tren product

Sau khi cleanup, nen chay lai lenh sau de cap nhat chinh xac `averageRating` va `totalReviews`:

```bash
npm run recalc:product-review-stats
```

## 9) Quy trinh de xuat (an toan)

Dung quy trinh nay moi lan seed lon:

1. Seed du lieu:

```bash
npm run seed:ml-data -- --minUsers=300 --minOrders=15 --maxOrders=30 --days=365
```

2. Kiem tra rule review:

```bash
npm run check:review-eligibility
```

3. Neu co vi pham, cleanup:

```bash
npm run cleanup:invalid-reviews -- --apply
```

4. Dong bo lai rating/review count:

```bash
npm run recalc:product-review-stats
```

5. Kiem tra lai lan cuoi:

```bash
npm run check:review-eligibility
```

## 10) Troubleshooting

### Loi: Khong co product nao trong DB

Nguyen nhan: Chua co du lieu san pham de tao order/review.

Cach xu ly:

- Tao/seed products truoc, sau do chay lai `seed:ml-data`.

### Loi ket noi DB

Nguyen nhan: Sai `MONGO_URI` hoac IP whitelist/permission.

Cach xu ly:

- Kiem tra `.env`
- Kiem tra quyen truy cap MongoDB

### Chart admin van it du lieu

Nguyen nhan: so luong seed chua lon hoac bo loc thoi gian qua hep.

Cach xu ly:

- Tang tham so seed (`minUsers`, `minOrders`, `maxOrders`, `days`)
- Mo rong time range tren trang Admin ML Analytics

## 11) Lenh nhanh copy-paste

```bash
cd furniture-shop-backend
npm run seed:ml-data -- --minUsers=300 --minOrders=15 --maxOrders=30 --days=365
npm run check:review-eligibility
npm run cleanup:invalid-reviews -- --apply
npm run recalc:product-review-stats
npm run check:review-eligibility
```
