#!/bin/bash
# ----- Thông tin cấu hình -----
# Tên profile AWS CLI cho tài khoản nguồn và đích
SRC_PROFILE="prod"
DST_PROFILE="dev"
# Vùng (region) dùng cho cả hai tài khoản
AWS_REGION="ap-southeast-1"
# Danh sách các bảng cần copy
TABLES=("misa-event" "misa-event-image" "misa-face-setup" "misa-face-unitree")
# Thư mục tạm để lưu file export
TMP_DIR="dynamodb_tmp"
mkdir -p $TMP_DIR
echo "=== Bắt đầu copy bảng DynamoDB giữa hai tài khoản AWS ==="
for TABLE in "${TABLES[@]}"
do
  echo ">>> Đang xử lý bảng: $TABLE"
  # Export dữ liệu từ AWS source
  aws dynamodb scan \
    --table-name $TABLE \
    --profile $SRC_PROFILE \
    --region $AWS_REGION \
    --output json \
    > $TMP_DIR/${TABLE}_data.json
  echo "    [+] Đã export bảng $TABLE từ tài khoản nguồn"
  # Tạo bảng trên tài khoản đích (giữ nguyên cấu trúc)
  aws dynamodb describe-table \
    --table-name $TABLE \
    --profile $SRC_PROFILE \
    --region $AWS_REGION \
    > $TMP_DIR/${TABLE}_desc.json
  aws dynamodb create-table \
    --cli-input-json file://$TMP_DIR/${TABLE}_desc.json \
    --profile $DST_PROFILE \
    --region $AWS_REGION
  echo "    [+] Đã tạo bảng $TABLE ở tài khoản đích"
  # Chờ bảng ở destination được tạo hoàn tất
  aws dynamodb wait table-exists \
    --table-name $TABLE \
    --profile $DST_PROFILE \
    --region $AWS_REGION
  echo "    [+] Đã sẵn sàng để import dữ liệu vào bảng $TABLE"
  # Import từng dòng dữ liệu (item) từ file json vào tài khoản đích
  ITEM_COUNT=$(jq '.Items |

 length' $TMP_DIR/${TABLE}_data.json)
  for ((i=0; i<$ITEM_COUNT; i++)); do
    ITEM=$(jq ".Items[$i]" $TMP_DIR/${TABLE}_data.json)
    aws dynamodb put-item \
      --table-name $TABLE \
      --item "$ITEM" \
      --profile $DST_PROFILE \
      --region $AWS_REGION
  done
  echo "    [*] Đã copy xong tất cả item vào bảng $TABLE"
done
echo "=== Hoàn tất copy 4 bảng DynamoDB giữa 2 account AWS ==="
