<script setup lang="ts">
</script>

<template>
  <div class="main-page">
    <div class="container">
      <h1>Shapez AP Tracker</h1>
      <nav class="navigation">
        <a href="viewer.html" class="nav-link">
          <div class="nav-card">
            <h2>Tile Viewer</h2>
            <p>View saved tile maps</p>
          </div>
        </a>
        <a href="editor.html" class="nav-link">
          <div class="nav-card">
            <h2>Tile Editor</h2>
            <p>Create and edit tile maps</p>
          </div>
        </a>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.main-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  text-align: center;
  max-width: 800px;
  width: 100%;
}

h1 {
  font-size: 3rem;
  margin-bottom: 3rem;
  color: #fff;
}

.navigation {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-link {
  text-decoration: none;
  flex: 1;
  min-width: 250px;
}

.nav-card {
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 2rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.nav-card:hover {
  border-color: #4CAF50;
  background: #222;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(76, 175, 80, 0.2);
}

.nav-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #4CAF50;
}

.nav-card p {
  color: #999;
  font-size: 0.9rem;
}
</style>