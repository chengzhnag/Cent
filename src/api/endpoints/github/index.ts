import { toast } from "sonner";
import { BillIndexedDBStorage } from "@/database/storage";
import { Gitray } from "@/gitray";
import { LoginModal } from '@/components/LoginModal';
import type { Bill } from "@/ledger/type";
import { t } from "@/locale";
import type { Book, SyncEndpointFactory } from "../type";
import { createLoginAPI } from "./login";

const config = {
    repoPrefix: "cent-journal",
    entryName: "ledger",
    orderKeys: ["time"],
};

const LoginAPI = createLoginAPI();

const manuallyLogin = async () => {
    const token = prompt(t("please-enter-your-github-token"));
    if (!token) {
        return;
    }
    LoginAPI.manuallySetToken(token);
    location.reload();
};

const passwordLogin = async () => {
    LoginModal.show({
        onLogin: (creds, call) => {
            console.log('登录:', creds);
            fetch('https://open.952737.xyz/api/auth', {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${btoa(`${creds.username}:${creds.password}`)}`
                }})
	        .then(res => res.json())
            .then(res => {
                const token = res?.data?.githubToken;
                if (token) {
                    toast.success('登录成功, 即将刷新页面');
                    call?.();
                    setTimeout(() => {
                        LoginAPI.manuallySetToken(token);
                        location.reload();
                    }, 1000);
                }
            }).catch(() => {
                toast.error('登录失败，请检查用户名和密码');
            });
        },
    });
};

export const GithubEndpoint: SyncEndpointFactory = {
    type: "github",
    name: "Github",
    login: LoginAPI.login,
    manuallyLogin,
    passwordLogin,
    init: () => {
        LoginAPI.afterLogin();
        const repo = new Gitray<Bill>({
            ...config,
            auth: LoginAPI.getToken,
            storage: (name) => new BillIndexedDBStorage(`book-${name}`),
        });

        const toBookName = (bookId: string) => {
            const [owner, repo] = bookId.split("/");
            return repo.replace(`${config.repoPrefix}-`, "");
        };

        const inviteForBook = (bookId: string) => {
            const ok = confirm(t("invite-tip"));
            if (!ok) {
                return;
            }
            window.open(
                `https://github.com/${bookId}/settings/access`,
                "_blank",
            );
        };

        const deleteBook = (bookId: string) => {
            const ok = confirm(t("delete-book-tip"));
            if (!ok) {
                return Promise.reject();
            }
            window.open(`https://github.com/${bookId}/settings`, "_blank");
            return Promise.reject();
        };

        return {
            logout: repo.dangerousClearAll.bind(repo),

            getUserInfo: repo.getUserInfo.bind(repo),
            getCollaborators: repo.getCollaborators.bind(repo),
            getOnlineAsset: repo.getOnlineAsset.bind(repo),

            fetchAllBooks: async (...args) => {
                const res = await repo.fetchAllStore(...args);
                return res.map((v) => ({ id: v, name: toBookName(v) }));
            },
            createBook: repo.createStore.bind(repo),
            initBook: repo.initStore.bind(repo),
            deleteBook,
            inviteForBook,

            batch: repo.batch.bind(repo),
            getMeta: repo.getMeta.bind(repo),
            getAllItems: repo.getAllItems.bind(repo),
            onChange: repo.onChange.bind(repo),

            getIsNeedSync: repo.getIsNeedSync.bind(repo),
            onSync: repo.onSync.bind(repo),
            toSync: repo.toSync.bind(repo),
        };
    },
};
