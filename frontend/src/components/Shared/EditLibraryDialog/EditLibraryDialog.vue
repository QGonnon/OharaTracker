<template>
  <EditProgressDialog
    type="manga"
    :visible="visible"
    :item="manga"
    @update:visible="$emit('update:visible', $event)"
    @updated="$emit('updated', $event)"
    @deleted="$emit('deleted', $event)"
  />
</template>

<script src="./EditLibraryDialog.ts"></script>
