<template>
    <v-text-field
      :value="modelValue"
      @input="updateValue($event)"
      :label="label"
      :outlined="outlined"
      :clearable="clearable"
      :class="customClass"
    />
  </template>
  
  <script>
  export default {
    name: 'CustomInput',
    props: {
      modelValue: {
        type: String,
        default: '',
      },
      label: {
        type: String,
        required: true,
      },
      outlined: {
        type: Boolean,
        default: true,
      },
      clearable: {
        type: Boolean,
        default: true,
      },
      customClass: {
        type: String,
        default: '',
      },
    },
    methods: {
      updateValue(value) {
        this.$emit('update:modelValue', value); // Emit sự kiện để cập nhật giá trị từ component con lên component cha
      },
    },
  };
  </script>
  
  <style scoped>
  /* Custom style cho input */
  .v-text-field {
    font-size: 14px;
  }
  
  /* Custom style nếu cần */
  </style>