<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
    router.back(); // Bir önceki sayfaya yönlendirir
};
</script>

<template>
  <div class="error-page">
    <div class="error-container">
      <h1 class="error-code">404</h1>
      <p class="error-message">Oops! Something went wrong.</p>
      <p class="error-description">
        The page you're looking for might have been removed, its name changed, or is temporarily unavailable.
      </p>
      <div class="error-actions">
        <button class="error-button" @click="goBack">Go Back</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f9f9f9;
  text-align: center;
  padding: 20px;
}

.error-container {
  max-width: 600px;
}

.error-code {
  font-size: 6rem;
  color: #ffa500; /* Turuncu renk */
  margin-bottom: 20px;
}

.error-message {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.error-description {
  font-size: 1rem;
  color: #666;
  margin-bottom: 20px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.error-button {
  background-color: #0a74da;
  color: #fff;
  border: none;
  padding: 10px 20px;
  font-size: 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.error-button:hover {
  background-color: #005bb5;
}
</style>
