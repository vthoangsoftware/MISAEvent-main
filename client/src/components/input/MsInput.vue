<template>
  <div class="msinput-container">
    <label v-if="label" class="msinput-label">{{ label }}</label>
    <div class="msinput-wrapper">
      <input
        :type="inputType"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="msinput"
      />
      <i v-if="rightIcon" :class="rightIcon" class="msinput-icon"></i>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

// Định nghĩa các props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Enter text...'
  },
  label: {
    type: String,
    default: ''
  },
  rightIcon: {
    type: String,
    default: ''
  },
});

// Đặt type input có thể là text, email, password... tùy nhu cầu
const inputType = 'text'; // Có thể thay đổi thành prop nếu cần
</script>

<style scoped>
.msinput-container {
  margin-bottom: 16px;
}

.msinput-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.msinput-wrapper {
  position: relative;
}

.msinput {
  width: 100%;
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.msinput:focus {
  border-color: #007bff; /* Đổi màu viền khi focus */
  outline: none; /* Ẩn outline mặc định */
}

.msinput-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%); /* Canh giữa icon */
  font-size: 16px;
  color: #999;
  pointer-events: none; /* Không cho phép tương tác với icon */
}
</style>
