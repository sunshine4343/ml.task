<template>
  <view>
    <cu-custom bgcolor="bg-gradual-blue" :isBack="true">
      <block slot="backText">返回</block>
      <block slot="content">事件记录</block>
    </cu-custom>
    <view class="cu-card">
      <view class="cu-item shadow">
        <view class="cu-list menu-avatar">
          <view class="cu-item">
            <view class="cu-avatar round lg">
              <image :src="logoUrl" class="logo" />
            </view>
            <view class="content flex-sub">
              <view>{{ event_title }}</view>
              <view class="text-gray text-sm flex justify-between"
                >创建于{{ date }}</view
              >
            </view>
          </view>
        </view>
        <view class="text-content">{{ description }}</view>
      </view>
    </view>
    <view class="container">
      <navigator
        hover-class="none"
        url="/pages/task_add/main"
        navigateTo
        class="cu-btn bg-gradual-blue shadow-blur round lg add-btn"
      >
        <text class="cuIcon-add"></text>添加记录
      </navigator>
      <!-- <button
        class="cu-btn bg-white shadow-blur round sm add-btn change-type filter-icon"
        :class="{ 'bg-gradual-blue': isFilter }"
        @click="filterActiveTask"
      >
        <text class="cuIcon-filter" style="font-size:14px"></text>
      </button> -->
      <view class="cu-timeline" v-if="!isNoTasks">
        <view class="cu-item">
          <view class="content shadow-blur">暂无记录</view>
        </view>
      </view>
      <view class="cu-timeline" v-for="(daySortItem, key) in tasks" :key="key">
        <view class="cu-time">
          <span style="font-size:20px">{{daySortItem[0].date_details.day}}</span> / {{daySortItem[0].date_details.month }} {{daySortItem[0].date_details.year? "/ " + daySortItem[0].date_details.year: ""}} {{ daySortItem[0].weekday }}
        </view>
        <view
          v-for="item in daySortItem"
          :key="item._id"
          :class="{
            'cu-item': true,
            'text-blue': item.state === 0 ? true : false
          }"
          @longpress="showModal(item._id, item)"
        >
          <view
            class="content light"
            :class="{ 'bg-gradual-blue': item.state === 0 }"
          >
            <view  class="cu-capsule radius">
              <view class="cu-tag bg-cyan borderRadius" :class="{'bg-grey': item.state===1}">{{ item.time }}</view>
              <text
                v-if="item.level !== 0"
                class="cuIcon-favorfill favorfillIcon text-yellow"
              ></text>
              <text
                class="cuIcon-check done-btn text-white"
                @click="doneTask(event_id, item._id)"
              ></text>
            </view>
            <view class="radius margin-top">
                <!-- 'margin-top': item.state === 0 ? true : false -->
              <p>{{ item.content }}</p>
              <!-- <p
                v-if="item.state !== 0"
                class="text-grey text-right margin-top"
              >
                创建：{{ item.time }}\n完成：{{ item.edit_time }}
              </p> -->
            </view>
          </view>
        </view>
      </view>
      <view class="cu-tabbar-height"></view>
    </view>
    <view class="cu-modal" :class="isShowModal ? 'show' : ''" @tap="hideModal">
      <view class="cu-dialog" @tap.stop>
        <view class="cu-list menu text-left">
          <view
            class="cu-item"
            v-for="(item, index) in longPressItemArr"
            :key="index"
            @click="doSomething(index)"
          >
            <label class="flex justify-between align-center flex-sub">
              <view class="flex-sub">{{ item }}</view>
            </label>
          </view>
        </view>
      </view>
    </view>
    <Loading v-if="isShowLoading"></Loading>
    <ReTry v-if="isShowReTry" @click="retryGetData"></ReTry>
  </view>
</template>

<script>
import { formatDate, formatTask } from "@/utils/index";
import {
  GET_ALL_TASKS,
  DONE_TASK,
  STORE_TASK_BY_TASK_ID,
  CLEAR_CURRENT_TASK,
  DELETE_TASK,
  STORE_ALL_TASKS
} from "@/store/mutation-types";
export default {
  data() {
    return {
      event_id: "",
      event_title: "",
      date: "",
      description: "",
      logoUrl: "/static/images/ml-task-logo.png",
      tasks: {},
      isNoTasks: true,
      isShowLoading: false,
      isShowReTry: false,
      isShowModal: false,
      longPressItemArr: ["编辑", "复制", "删除"],
      currentTask: {},
      isFilter: false
    };
  },
  onShow() {
    this.$store.commit(`event/${CLEAR_CURRENT_TASK}`);
    const { event, user } = this.$store.state;
    const { _id, title, date, description } = event.currentEvent;
    this.event_id = _id;
    this.event_title = title;
    this.date = formatDate(new Date(date)).fullDate;
    this.description = description;
    const isNeedRefreshTask = event.isNeedRefreshTask;
    if (
      !event.tasks[this.event_id] ||
      event.isNeedRefreshTask[this.event_id].isNeed
    ) {
      this.isShowLoading = true;
      this.getTasks(this.event_id);
    } else {
      this.tasks = event.tasks[this.event_id];
      this.checkTasks(this.tasks);
    }
  },
  methods: {
    getTasks(event_id) {
      this.isShowLoading = true;
      this.$store.dispatch(`event/${GET_ALL_TASKS}`, {
        event_id,
        onSuccess: this.getAllTasksSuccess,
        onFailed: this.getAllTasksFailed
      });
    },
    getAllTasksSuccess(tasks) {
      this.tasks = tasks;
      this.checkTasks(tasks);
      this.isShowLoading = false;
      this.isShowReTry = false;
    },
    getAllTasksFailed() {
      this.isShowLoading = false;
      this.isShowReTry = true;
      this.showToast("请求失败，请重试");
    },
    checkTasks(obj) {
      Object.keys(obj).length
        ? (this.isNoTasks = true)
        : (this.isNoTasks = false);
    },
    doneTask(event_id, task_id) {
      this.$store.dispatch(`event/${DONE_TASK}`, {
        event_id,
        task_id,
        onSuccess: this.doneTaskSuccess
      });
    },
    doneTaskSuccess(message) {
      this.getTasks(this.event_id);
      this.showToast(message);
    },
    editTask() {
      wx.navigateTo({ url: `/pages/task_add/main` });
    },
    delTask() {
      this.isShowLoading = true;
      this.isShowReTry = false;
      this.$store.dispatch(`event/${DELETE_TASK}`, {
        onSuccess: this.delSuccess,
        onFailed: this.delFailed
      });
    },
    delSuccess(message) {
      this.getTasks(this.event_id);
      this.isShowLoading = false;
      this.isShowReTry = false;
      this.showToast(message);
    },
    delFailed() {
      this.isShowLoading = false;
      this.showToast("删除失败，请重试");
    },
    showModal(task_id, task) {
      this.$store.commit(`event/${STORE_TASK_BY_TASK_ID}`, task);
      this.currentTask = task;
      this.isShowModal = true;
    },
    hideModal() {
      this.isShowModal = false;
      this.$store.commit(`event/${CLEAR_CURRENT_TASK}`);
    },
    doSomething(index) {
      this.isShowModal = false;
      switch (index) {
        case 0:
          if (this.currentTask.state === 1) {
            this.showToast("已完成记录不支持编辑");
            return;
          }
          this.editTask();
          break;
        case 1:
          wx.setClipboardData({ data: this.currentTask.content });
          break;
        case 2:
          this.delTask();
          break;
        default:
          break;
      }
    },
    retryGetData() {
      this.isShowReTry = false;
      this.isShowLoading = true;
      const { retryActionPayload, retryActionType } = this.$store.state.miniapp;
      this.$store.dispatch(retryActionType, retryActionPayload);
    },
    filterActiveTask() {
      this.isFilter = !this.isFilter;
      const { event } = this.$store.state;
      const { tasksOriginal } = event;
      if (this.isFilter) {
        this.tasks = formatTask(tasksOriginal.filter(v => v.state===0))
      } else {
        this.tasks = event.tasks[this.event_id];
      }
    }
  },
  onUnload() {
    Object.assign(this.$data, this.$options.data());
  }
};
</script>

<style scoped>
.container {
  padding: 16px;
  position: relative;
}
.cu-capsule {
  position: relative;
  width: 100%;
}
.cu-capsule .done-btn {
  position: absolute;
  right: 0;
  width: 25px;
  height: 25px;
  line-height: 25px;
  text-align: center;
  font-weight: 700;
}
.cuIcon-favorfill {
  font-size: 20px;
  /* color: #e54d42; */
}
.cu-tag.borderRadius {
  border-radius: 3px !important;
}
.cu-card > .cu-item {
  margin: 0 16px !important;
}
.cu-timeline .cu-time {
  width: auto !important;
  text-align: left !important;
}
.favorfillIcon {
  line-height: 24px;
  margin-left: 10px;
}
.cu-avatar {
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
}
.logo {
  width: 100%;
  height: 100%;
}
.change-type {
  position: absolute;
  width: 30px;
  height: 30px;
  left: auto;
  right: 5px;
  top: 20px;
  border: 1px solid #efefef;
}
.filter-icon {
  right: 15px;
}
</style>
