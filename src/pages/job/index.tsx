/**
 * @file 任务列表
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Ban, CheckCircle, ParkingCircle, RotateCw, Timer, Trash } from "lucide-solid";

import { Button, Skeleton, ScrollView, ListView, Checkbox, Progress } from "@/components/ui";
import { ButtonCore, ButtonInListCore, CheckboxCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { JobItem, clear_expired_job_list, fetchJobList, pause_job, TaskStatus, JobCore } from "@/domains/job";
import { homeTaskProfilePage, onJobsChange, onJobsPercentChange, refreshJobs } from "@/store";
import { ViewComponent } from "@/types";
import { cn } from "@/utils";

export const TaskListPage: ViewComponent = (props) => {
  const { app, view } = props;

  const jobList = new ListCore(new RequestCore(fetchJobList), {});
  const pauseJob = new RequestCore(pause_job, {
    onLoading(loading) {
      pauseJobBtn.setLoading(loading);
    },
    onFailed: (err) => {
      app.tip({ text: ["中止任务失败", err.message] });
    },
    onSuccess: () => {
      app.tip({ text: ["中止任务成功"] });
      jobList.refresh();
    },
  });
  const jobDeletingRequest = new RequestCore(clear_expired_job_list, {
    onLoading(loading) {
      jobDeletingBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["清除成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["清除失败", error.message],
      });
    },
  });
  const pauseJobBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      pauseJob.run(task.id);
    },
  });
  const profileBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      homeTaskProfilePage.query = {
        id: task.id,
      };
      app.showView(homeTaskProfilePage);
      // homeLayout.showSubView(homeTaskProfilePage);
      // router.push(`/home/task/${task.id}`);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      refreshJobs();
      jobList.refresh();
    },
  });
  const runningCheckbox = new CheckboxCore({
    onChange(checked) {
      jobList.search({});
    },
  });
  const jobDeletingBtn = new ButtonCore({
    onClick() {
      jobDeletingRequest.run();
    },
  });
  const scrollView = new ScrollViewCore();

  jobList.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });

  const [response, setResponse] = createSignal(jobList.response);
  // const [runningJobs, setRunningJobs] = createSignal<JobCore[]>([]);

  jobList.onStateChange((nextState) => {
    setResponse(nextState);
  });
  onJobsChange((jobs) => {
    jobList.modifyDataSource((item) => {
      const matched = jobs.find((j) => j.id === item.id);
      if (!matched) {
        return item;
      }
      // item.percent = matched.percent;
      // item.updated = matched.updated!;
      // return item;
      return {
        ...item,
        percent: matched.percent,
        updated: matched.updated!,
      };
    });
  });
  // onJobsPercentChange((percents) => {
  //   setRunningJobs(percents);
  // });

  const statusIcons: Record<TaskStatus, () => JSX.Element> = {
    [TaskStatus.Finished]: () => <CheckCircle class="w-4 h-4" />,
    [TaskStatus.Paused]: () => <Ban class="w-4 h-4" />,
    [TaskStatus.Running]: () => <Timer class="w-4 h-4" />,
  };

  scrollView.onReachBottom(() => {
    jobList.loadMore();
  });
  jobList.init();

  const dataSource = () => response().dataSource;

  return (
    <ScrollView store={scrollView} class="h-screen p-4">
      <h1 class="text-2xl">任务列表</h1>
      <div class="mt-8 flex space-x-2">
        <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
          刷新
        </Button>
      </div>
      <div class="flex items-center space-x-2 mt-4">
        <Checkbox store={runningCheckbox} />
      </div>
      <ListView
        class="mt-4"
        store={jobList}
        skeleton={
          <div class="p-4 rounded-sm bg-white">
            <div class={cn("space-y-1")}>
              <Skeleton class="w-[240px] h-8"></Skeleton>
              <div class="flex space-x-4">
                <Skeleton class="w-[320px] h-4"></Skeleton>
              </div>
              <div class="flex space-x-2">
                <Skeleton class="w-24 h-8"></Skeleton>
                <Skeleton class="w-24 h-8"></Skeleton>
              </div>
            </div>
          </div>
        }
      >
        <div class="space-y-4">
          <For each={dataSource()}>
            {(task, i) => {
              const { id, desc, created, status, statusText } = task;
              return (
                <div class={cn("space-y-1 p-4 rounded-sm bg-white")}>
                  <h2 class="text-xl">{desc}</h2>
                  <div class="flex space-x-4">
                    <div>{created}</div>
                    <div class="flex items-center space-x-1">
                      <Dynamic component={statusIcons[status]} />
                      <div class={cn({})}>{statusText}</div>
                    </div>
                  </div>
                  <Show when={status === TaskStatus.Running}>
                    <div class="mt-4">
                      <div
                        class={cn("relative h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800")}
                      >
                        <div
                          class="h-full w-full flex-1 bg-slate-900 transition-all dark:bg-slate-400"
                          style={{ transform: `translateX(-${100 - task.percent * 100}%)` }}
                        />
                      </div>
                      <div class="text-sm text-slate-800">{task.percent * 100}%</div>
                      <div class="text-sm text-slate-800">{task.updated}</div>
                    </div>
                  </Show>
                  <div class="mt-2 space-x-2">
                    <Button store={profileBtn.bind(task)} variant="subtle">
                      详情
                    </Button>
                    <Show when={status === TaskStatus.Running}>
                      <Button store={pauseJobBtn.bind(task)} icon={<ParkingCircle class="w-4 h-4" />} variant="subtle">
                        停止任务
                      </Button>
                    </Show>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </ListView>
    </ScrollView>
  );
};
