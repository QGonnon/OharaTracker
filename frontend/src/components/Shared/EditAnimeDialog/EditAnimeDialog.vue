<template>
  <EditProgressDialog
    type="anime"
    :visible="visible"
    :item="anime"
    @update:visible="$emit('update:visible', $event)"
    @updated="$emit('updated', $event)"
    @deleted="$emit('deleted', $event)"
  />
</template>

<script src="./EditAnimeDialog.ts"></script>
