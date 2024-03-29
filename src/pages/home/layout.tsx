/**
 * @file 后台/首页布局
 */
import { Component, For, JSX, JSXElement, createSignal, onMount } from "solid-js";
import {
  Film,
  Users,
  FolderInput,
  Home,
  EyeOff,
  Bot,
  Flame,
  LogOut,
  Settings,
  Tv,
  FileSearch,
  File,
  CircuitBoard,
  Subtitles,
  MessageCircle,
  AlarmClock,
  Folder,
} from "lucide-solid";

import { fetchSettings, notify_test, pushMessageToMembers, updateSettings } from "@/services";
import { Button, Dialog, DropdownMenu, Input, KeepAliveRouteView, Textarea } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { FileSearchDialog, FileSearcherCore } from "@/components/FileSearcher";
import { ButtonCore, DialogCore, DropdownMenuCore, InputCore, MenuCore, MenuItemCore } from "@/domains/ui";
import { RouteViewCore } from "@/domains/route_view";
import { RequestCore } from "@/domains/request";
import { Application } from "@/domains/app";
import { Show } from "@/packages/ui/show";
import { ViewComponent } from "@/types";
import {
  homeFilenameParsingPage,
  homeIndexPage,
  homeMemberListPage,
  homeMovieListPage,
  homeTVListPage,
  homeTaskListPage,
  homeTransferPage,
  homeUnknownMediaLayout,
} from "@/store/views";
import {
  collectionListPage,
  homePersonListPage,
  homeReportListPage,
  homeSubtitleListPage,
  invalidMediasPage,
  onJobsChange,
  syncTaskListPage,
} from "@/store";
import { cn, sleep } from "@/utils";

export const HomeLayout: ViewComponent = (props) => {
  const { app, view } = props;

  const settingsRequest = new RequestCore(fetchSettings, {
    onLoading(loading) {
      settingsBtn.setLoading(loading);
    },
    onSuccess(v) {
      const { push_deer_token = "", extra_filename_rules = "", ignore_files_when_sync = "" } = v;
      notify1TokenInput.setValue(push_deer_token);
      filenameParseRuleInput.setValue(extra_filename_rules);
      ignoreFilesRuleInput.setValue(ignore_files_when_sync);
    },
    onFailed(error) {
      app.tip({
        text: ["获取设置失败", error.message],
      });
    },
  });
  const pushRequest = new RequestCore(pushMessageToMembers, {
    onLoading(loading) {
      pushDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["推送成功"],
      });
      pushDialog.hide();
    },
  });
  const expiredDeletingRequest = new RequestCore(fetchSettings, {
    onLoading(loading) {
      expiredDeletingBtn.setLoading(loading);
    },
    onSuccess(v) {
      app.tip({
        text: ["清除成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["获取设置失败", error.message],
      });
    },
  });
  const tmdbDialog = new TMDBSearcherDialogCore({
    footer: false,
  });
  const fileSearchDialog = new FileSearcherCore({
    footer: false,
  });
  const pushInput = new InputCore({
    defaultValue: "",
    onEnter() {
      pushDialog.okBtn.click();
    },
  });
  const pushDialog = new DialogCore({
    title: "群发消息",
    onOk() {
      if (!pushInput.value) {
        app.tip({
          text: ["请输入推送内容"],
        });
        return;
      }
      pushRequest.run({
        content: pushInput.value,
      });
    },
  });
  const logoutBtn = new ButtonCore({
    async onClick() {
      logoutBtn.setLoading(true);
      app.user.logout();
      await sleep(2000);
      logoutBtn.setLoading(false);
    },
  });
  const settingsUpdateRequest = new RequestCore(updateSettings, {
    onLoading(loading) {
      settingsDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["更新成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["更新失败", error.message],
      });
    },
  });
  const settingsDialog = new DialogCore({
    title: "配置",
    onOk() {
      const notify1Token = notify1TokenInput.value?.trim();
      const ignoreFilesRule = ignoreFilesRuleInput.value?.trim();
      const filenameParse = filenameParseRuleInput.value?.trim();
      const values = {
        ignore_files_when_sync: ignoreFilesRule,
        push_deer_token: notify1TokenInput.value?.trim(),
        extra_filename_rules: filenameParseRuleInput.value?.trim(),
      };
      if (notify1Token) {
        values.push_deer_token = notify1Token;
      }
      if (filenameParse) {
        values.extra_filename_rules = filenameParse;
      }
      if (Object.keys(values).length === 0) {
        app.tip({
          text: ["配置不能均为空"],
        });
        return;
      }
      if (values.extra_filename_rules) {
        const rules = values.extra_filename_rules.split("\n\n").map((rule) => {
          const [regexp, placeholder] = rule.split("\n");
          return {
            regexp,
            placeholder,
          };
        });
        const invalid_rule = rules.some((rule) => {
          const { regexp, placeholder } = rule;
          if (!regexp || !placeholder) {
            return true;
          }
          try {
            new RegExp(regexp);
          } catch (err) {
            return true;
          }
        });
        if (invalid_rule) {
          app.tip({
            text: ["存在不合法的解析规则，请检查后重新提交"],
          });
          return;
        }
      }
      settingsUpdateRequest.run(values);
    },
  });
  const filenameParseRuleInput = new InputCore({
    defaultValue: "",
    placeholder: "额外解析规则",
  });
  const ignoreFilesRuleInput = new InputCore({
    defaultValue: "",
    placeholder: "转存时可忽略指定文件/文件夹",
  });
  const notify1TokenInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入 push deer token",
  });
  const notify1TestRequest = new RequestCore(notify_test, {
    onLoading(loading) {
      notify1TestBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["发送成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["发送失败", error.message],
      });
    },
  });
  const notify1TestInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入文本测试消息推送",
  });
  const notify1TestBtn = new ButtonCore({
    onClick() {
      if (!notify1TokenInput.value) {
        app.tip({
          text: ["请输入推送 token"],
        });
        return;
      }
      if (!notify1TestInput.value) {
        app.tip({
          text: ["请输入推送文本"],
        });
        return;
      }
      notify1TestRequest.run({
        text: notify1TestInput.value,
        token: notify1TokenInput.value,
      });
    },
  });
  const settingsBtn = new ButtonCore({
    onClick() {
      settingsRequest.run();
      settingsDialog.show();
    },
  });
  const expiredDeletingBtn = new ButtonCore({});

  const [curSubView, setCurSubView] = createSignal(view.curView);
  const [subViews, setSubViews] = createSignal(view.subViews);

  view.onSubViewsChange((nextSubViews) => {
    setSubViews(nextSubViews);
  });
  view.onCurViewChange((nextCurView) => {
    setCurSubView(nextCurView);
  });
  tmdbDialog.onTip((msg) => {
    app.tip(msg);
  });
  fileSearchDialog.onTip((msg) => {
    app.tip(msg);
  });

  const [menus, setMenus] = createSignal<
    {
      text: string;
      icon: JSXElement;
      view: RouteViewCore;
      badge?: boolean;
      onClick?: () => void;
    }[]
  >([
    {
      text: "首页",
      icon: <Home class="w-6 h-6" />,
      view: homeIndexPage,
    },
    {
      text: "任务",
      icon: <Bot class="w-6 h-6" />,
      badge: false,
      view: homeTaskListPage,
    },
    {
      text: "电视剧",
      icon: <Tv class="w-6 h-6" />,
      view: homeTVListPage,
    },
    {
      text: "电影",
      icon: <Film class="w-6 h-6" />,
      view: homeMovieListPage,
    },
    // {
    //   text: "未识别影视剧",
    //   icon: <EyeOff class="w-6 h-6" />,
    //   view: homeUnknownMediaLayout,
    // },
    // {
    //   text: "待处理影视剧问题",
    //   icon: <Bot class="w-6 h-6" />,
    //   badge: false,
    //   view: invalidMediasPage,
    // },
    // {
    //   text: "集合管理",
    //   icon: <Folder class="w-6 h-6" />,
    //   view: collectionListPage,
    // },
    // {
    //   text: "字幕管理",
    //   icon: <Subtitles class="w-6 h-6" />,
    //   view: homeSubtitleListPage,
    // },
    // {
    //   text: "同步任务",
    //   icon: <AlarmClock class="w-6 h-6" />,
    //   view: syncTaskListPage,
    // },
    // {
    //   text: "任务",
    //   icon: <Bot class="w-6 h-6" />,
    //   badge: false,
    //   view: homeTaskListPage,
    // },
    // {
    //   text: "问题反馈",
    //   icon: <CircuitBoard class="w-6 h-6" />,
    //   badge: false,
    //   view: homeReportListPage,
    // },
    // {
    //   text: "云盘文件搜索",
    //   icon: <File class="w-6 h-6" />,
    //   onClick() {
    //     fileSearchDialog.show();
    //   },
    // },
    // {
    //   text: "TMDB 数据库",
    //   icon: <Flame class="w-6 h-6" />,
    //   onClick() {
    //     tmdbDialog.show();
    //   },
    // },
    // {
    //   text: "群发消息",
    //   icon: <MessageCircle class="w-6 h-6" />,
    //   onClick() {
    //     pushDialog.show();
    //   },
    // },
    // {
    //   text: "成员",
    //   icon: <Users class="w-6 h-6" />,
    //   view: homeMemberListPage,
    // },
    // {
    //   text: "转存资源",
    //   icon: <FolderInput class="w-6 h-6" />,
    //   view: homeTransferPage,
    // },
    // {
    //   text: "文件名解析",
    //   icon: <FileSearch class="w-6 h-6" />,
    //   view: homeFilenameParsingPage,
    // },
  ]);
  const userDropdown = new DropdownMenuCore({
    align: "start",
    side: "bottom",
    items: [
      new MenuItemCore({
        icon: <Settings class="w-4 h-4" />,
        label: "设置",
        onClick() {
          settingsRequest.run();
          userDropdown.hide();
          settingsDialog.show();
        },
      }),
      new MenuItemCore({
        icon: <LogOut class="w-4 h-4" />,
        label: "退出登录",
        async onClick() {
          logoutBtn.setLoading(true);
          app.user.logout();
          await sleep(2000);
          userDropdown.hide();
          logoutBtn.setLoading(false);
        },
      }),
    ],
  });

  return (
    <>
      <div class="flex w-full h-full bg-white">
        <div class="flex-1 bg-slate-100">
          <div class="relative w-full h-full">
            <For each={subViews()}>
              {(subView, i) => {
                const PageContent = subView.component as ViewComponent;
                return (
                  <KeepAliveRouteView
                    class={cn(
                      "absolute inset-0",
                      "data-[state=open]:animate-in data-[state=open]:fade-in",
                      "data-[state=closed]:animate-out data-[state=closed]:fade-out"
                    )}
                    store={subView}
                    index={i()}
                  >
                    <PageContent app={app} router={app.router} view={subView} />
                  </KeepAliveRouteView>
                );
              }}
            </For>
          </div>
        </div>
      </div>
      <div class="z-50 fixed bottom-0 w-full flex bg-slate-100">
        <For each={menus()}>
          {(menu) => {
            const { icon, text, view, badge, onClick } = menu;
            return (
              <Menu
                app={app}
                icon={icon}
                highlight={(() => {
                  return curSubView() === view;
                })()}
                view={view}
                badge={badge}
                onClick={onClick}
              >
                {text}
              </Menu>
            );
          }}
        </For>
      </div>
    </>
  );
};

function Menu(
  props: {
    app: Application;
    highlight?: boolean;
    view?: RouteViewCore;
    icon: JSX.Element;
    badge?: boolean;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const inner = (
    <div
      class={cn(
        "relative flex flex-1 justify-center p-4 rounded-lg opacity-80 cursor-pointer hover:bg-slate-300",
        props.highlight ? "bg-slate-200" : ""
      )}
      onClick={props.onClick}
    >
      <div class="w-6 h-6">{props.icon}</div>
      {/* <div class="flex-1 text-lg text-slate-800">
        <div class="relative inline-block">
          {props.children}
          <Show when={props.badge}>
            <div class="absolute right-[-8px] top-0 w-2 h-2 rounded-full bg-red-500" />
          </Show>
        </div>
      </div> */}
    </div>
  );
  return (
    <Show when={props.view} fallback={inner}>
      <div
        class="flex-1"
        onClick={() => {
          if (!props.view) {
            return;
          }
          console.log("show");
          props.app.showView(props.view);
        }}
      >
        {inner}
      </div>
    </Show>
  );
}
