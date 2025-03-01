<template>
    <div class="login">
        <h1>Login</h1>
        <form @submit.prevent="login">
            <input type="text" v-model="username" placeholder="Username" required>
            <input type="password" v-model="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
    </div>
</template>

<script src="./Login.ts"></script>

<style>
    @import './Login.css';
</style>