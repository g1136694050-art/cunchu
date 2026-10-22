<template>
  <div class="main-layout">
    <router-view />
    <van-tabbar route fixed placeholder safe-area-inset-bottom>
      <van-tabbar-item replace to="/home" icon="home-o">存量</van-tabbar-item>
      <van-tabbar-item replace to="/locations" icon="location-o">位置</van-tabbar-item>
      <van-tabbar-item replace to="/alerts" icon="bell">提醒</van-tabbar-item>
      <van-tabbar-item replace to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
