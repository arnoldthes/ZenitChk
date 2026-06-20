/**
 * ==========================================================================
 * ZENIT SECURE APPLE OS ENGINE - ARCHITECTURE V4.0
 * ==========================================================================
 */

const CORE_SECURITY_SALT = 0xDE;
const SYSTEM_MASTER_KEY = "ZENIT2026";

let ApplicationState = {
    activeSession: null,
    debugMode: true,
    audioFeedback: false,
    operationsCount: 42100,
    currentTheme: "dark", // dark | light
    currentWallpaper: "bg-preset-aura"
};

const LocalEncryptedDB = {
    saveRaw(vaultKey, objectData) {
        try {
            const rawString = JSON.stringify(objectData);
            let obfuscated = "";
            for (let i = 0; i < rawString.length; i++) {
                obfuscated += String.fromCharCode(rawString.charCodeAt(i) ^ CORE_SECURITY_SALT);
            }
            localStorage.setItem(vaultKey, btoa(obfuscated));
            return true;
        } catch (e) { return false; }
    },

    getRaw(vaultKey) {
        try {
            const base64Buffer = localStorage.getItem(vaultKey);
            if (!base64Buffer) return null;
            const decodedObfuscation = atob(base64Buffer);
            let clearedString = "";
            for (let i = 0; i < decodedObfuscation.length; i++) {
                clearedString += String.fromCharCode(decodedObfuscation.charCodeAt(i) ^ CORE_SECURITY_SALT);
            }
            return JSON.parse(clearedString);
        } catch (e) { return null; }
    }
};

const SystemNotifier = {
    trigger(messageText, type = "success") {
        const anchor = document.getElementById("toast-anchor-zone");
        if (!anchor) return;
        const el = document.createElement("div");
        el.className = `toast-message ${type}`;
        el.innerText = messageText;
        anchor.appendChild(el);
        setTimeout(() => {
            el.style.opacity = "0";
            setTimeout(() => { el.remove(); }, 300);
        }, 3000);
    }
};

const AuditLogger = {
    append(module, msg) {
        let logs = LocalEncryptedDB.getRaw("zenit_audit_logs") || [];
        const timestamp = new Date().toISOString().substring(11, 19);
        logs.unshift({ time: timestamp, module, msg });
        if (logs.length > 50) logs.pop();
        LocalEncryptedDB.saveRaw("zenit_audit_logs", logs);
        this.syncDOM();
    },
    syncDOM() {
        const container = document.getElementById("dom-target-audit-logs");
        if (!container) return;
        let logs = LocalEncryptedDB.getRaw("zenit_audit_logs") || [];
        container.innerHTML = logs.map(log => `
            <div class="log-line">
                <span class="log-time">[${log.time}]</span>
                <span class="log-module">${log.module}</span>
                <span class="log-body">${log.msg}</span>
            </div>
        `).join("");
    }
};

// UI KONTROL ETKİ ALANI (SideBar Tam Kapanma ve Tema Geçişleri)
const UIEngine = {
    toggleSidebar() {
        const stage = document.getElementById("dashboard-stage");
        stage.classList.toggle("sidebar-fully-collapsed");
    },

    toggleThemeMode() {
        const body = document.body;
        const toggleBtn = document.getElementById("premium-theme-sun-toggle");
        
        if (ApplicationState.currentTheme === "dark") {
            ApplicationState.currentTheme = "light";
            body.classList.add("light-theme");
            toggleBtn.innerText = "🌙"; // Basınca Ay ikonuna dönsün
            SystemNotifier.trigger("Premium Light Mode activated.");
        } else {
            ApplicationState.currentTheme = "dark";
            body.classList.remove("light-theme");
            toggleBtn.innerText = "☀️"; // Basınca Güneş ikonuna dönsün
            SystemNotifier.trigger("Premium Obsidian Dark Mode activated.");
        }
        localStorage.setItem("zenit_sys_theme", ApplicationState.currentTheme);
    },

    changeWallpaper(wallpaperClass) {
        const body = document.body;
        // Mevcut tüm arka plan class'larını süz
        body.classList.remove("bg-preset-aura", "bg-preset-midnight", "bg-preset-sequoia", "bg-preset-lightstudio");
        body.classList.add(wallpaperClass);
        ApplicationState.currentWallpaper = wallpaperClass;
        localStorage.setItem("zenit_sys_wallpaper", wallpaperClass);
        SystemNotifier.trigger("System visual mesh context updated.");
        AuditLogger.append("CORE_UI", `Wallpaper changed to ${wallpaperClass}`);
    },

    loadPersistedThemeAndWallpaper() {
        const savedTheme = localStorage.getItem("zenit_sys_theme");
        const savedWp = localStorage.getItem("zenit_sys_wallpaper");
        
        if (savedTheme === "light") {
            ApplicationState.currentTheme = "light";
            document.body.classList.add("light-theme");
            document.getElementById("premium-theme-sun-toggle").innerText = "🌙";
        }
        if (savedWp) {
            this.changeWallpaper(savedWp);
        }
    }
};

const AuthEngine = {
    initDatabase() {
        let vault = LocalEncryptedDB.getRaw("zenit_users_vault");
        if (!vault) {
            const seedUsers = [
                { u: "admin", p: "zenit2026", r: "ROOT_ADMIN" },
                { u: "zenit_user", p: "123", r: "Normal User" }
            ];
            LocalEncryptedDB.saveRaw("zenit_users_vault", seedUsers);
            AuditLogger.append("KERNEL", "Database structures established.");
        }
    },

    switchView(view) {
        if (view === "register") {
            document.getElementById("auth-login-card").classList.add("hidden");
            document.getElementById("auth-register-card").classList.remove("hidden");
        } else {
            document.getElementById("auth-register-card").classList.add("hidden");
            document.getElementById("auth-login-card").classList.remove("hidden");
        }
    },

    evaluateRoleField() {
        const role = document.getElementById("slc-reg-role").value;
        const masterKeyField = document.getElementById("wrapper-master-key");
        if (role === "ROOT_ADMIN") masterKeyField.classList.remove("hidden");
        else masterKeyField.classList.add("hidden");
    },

    executeRegister() {
        const u = document.getElementById("inp-reg-username").value.trim();
        const p = document.getElementById("inp-reg-password").value;
        const r = document.getElementById("slc-reg-role").value;
        const masterKey = document.getElementById("inp-reg-masterkey").value;

        if (!u || !p) {
            SystemNotifier.trigger("Parameters cannot be null.", "error");
            return;
        }

        if (r === "ROOT_ADMIN" && masterKey !== SYSTEM_MASTER_KEY) {
            SystemNotifier.trigger("Unauthorized Master Key Verification.", "error");
            return;
        }

        let vault = LocalEncryptedDB.getRaw("zenit_users_vault") || [];
        if (vault.some(x => x.u.toLowerCase() === u.toLowerCase())) {
            SystemNotifier.trigger("Identity ID is already mapped.", "error");
            return;
        }

        vault.push({ u, p, r });
        LocalEncryptedDB.saveRaw("zenit_users_vault", vault);
        SystemNotifier.trigger("Identity created.", "success");
        AuditLogger.append("AUTH_REG", `New core registry: [${u}] -> Rank: ${r}`);
        
        document.getElementById("inp-reg-username").value = "";
        document.getElementById("inp-reg-password").value = "";
        document.getElementById("inp-reg-masterkey").value = "";
        this.switchView("login");
    },

    executeLogin() {
        const u = document.getElementById("inp-login-username").value.trim();
        const p = document.getElementById("inp-login-password").value;

        let vault = LocalEncryptedDB.getRaw("zenit_users_vault") || [];
        let user = vault.find(x => x.u === u && x.p === p);

        if (user) {
            ApplicationState.activeSession = user;
            SystemNotifier.trigger("Welcome back.", "success");
            AuditLogger.append("AUTH", `Token established for: [${user.u}]`);

            setTimeout(() => {
                document.getElementById("auth-stage").classList.add("hidden");
                document.getElementById("dashboard-stage").classList.remove("hidden");
                
                document.getElementById("display-username").innerText = user.u.toUpperCase();
                document.getElementById("display-user-initial").innerText = user.u.substring(0,1).toUpperCase();
                
                const badge = document.getElementById("display-user-role");
                badge.innerText = user.r;
                badge.className = "badge-role " + (user.r === "ROOT_ADMIN" ? "role-admin" : user.r === "Premium" ? "role-premium" : "role-normal");

                AdminPanelEngine.reloadStatistics();
                AdminPanelEngine.renderUsersTable();
                AuditLogger.syncDOM();
                DashboardRouter.navigate("overview");
            }, 500);
        } else {
            SystemNotifier.trigger("Authentication failed.", "error");
        }
    },

    executeLogout() {
        ApplicationState.activeSession = null;
        document.getElementById("inp-login-password").value = "";
        document.getElementById("dashboard-stage").classList.add("hidden");
        document.getElementById("auth-stage").classList.remove("hidden");
        SystemNotifier.trigger("Secure tunnel decoupled.");
    }
};

const DashboardRouter = {
    navigate(paneId) {
        document.querySelectorAll(".tab-pane").forEach(p => { p.classList.add("hidden"); p.classList.remove("active"); });
        document.querySelectorAll(".nav-menu-item").forEach(b => b.classList.remove("active"));
        const target = document.getElementById(`pane-${paneId}`);
        if (target) { target.classList.remove("hidden"); target.classList.add("active"); }
        const btn = document.getElementById(`menu-btn-${paneId}`);
        if (btn) btn.classList.add("active");
        document.getElementById("view-title").innerText = paneId.toUpperCase();
    }
};

const AdminPanelEngine = {
    reloadStatistics() {
        let vault = LocalEncryptedDB.getRaw("zenit_users_vault") || [];
        document.getElementById("stat-total-accounts").innerText = vault.length;
        document.getElementById("stat-premium-accounts").innerText = vault.filter(x => x.r === "Premium").length;
        document.getElementById("stat-admin-accounts").innerText = vault.filter(x => x.r === "ROOT_ADMIN").length;
        document.getElementById("stat-total-operations").innerText = ApplicationState.operationsCount;
    },

    renderUsersTable() {
        const body = document.getElementById("dom-target-users-table");
        if (!body) return;
        let vault = LocalEncryptedDB.getRaw("zenit_users_vault") || [];
        body.innerHTML = "";
        vault.forEach((user, idx) => {
            let rClass = user.r === "ROOT_ADMIN" ? "role-admin" : user.r === "Premium" ? "role-premium" : "role-normal";
            const tr = document.createElement("tr");
            tr.setAttribute("data-filter", user.u.toLowerCase());
            tr.innerHTML = `
                <td><strong>${user.u}</strong></td>
                <td><span class="badge-role ${rClass}">${user.r}</span></td>
                <td><span style="color:var(--apple-blue)">STABLE_NODE</span></td>
                <td>
                    <button class="btn-action" onclick="AdminPanelEngine.cycleUserRole(${idx})">Change Level</button>
                </td>
            `;
            body.appendChild(tr);
        });
        this.updateTableCounter();
    },

    cycleUserRole(idx) {
        if (ApplicationState.activeSession.r !== "ROOT_ADMIN") {
            SystemNotifier.trigger("Denied: Administrative privileges required.", "error");
            return;
        }
        let vault = LocalEncryptedDB.getRaw("zenit_users_vault") || [];
        if (!vault[idx]) return;

        const oldRole = vault[idx].r;
        if (oldRole === "Normal User") vault[idx].r = "Premium";
        else if (oldRole === "Premium") vault[idx].r = "ROOT_ADMIN";
        else vault[idx].r = "Normal User";

        LocalEncryptedDB.saveRaw("zenit_users_vault", vault);
        SystemNotifier.trigger(`Altered authorization level for ${vault[idx].u}`, "success");
        AuditLogger.append("MATRIX_SEC", `Rank swap: [${vault[idx].u}] became ${vault[idx].r}`);
        this.reloadStatistics();
        this.renderUsersTable();
    },

    filterUsersTable() {
        const query = document.getElementById("inp-search-users").value.toLowerCase().trim();
        document.querySelectorAll("#dom-target-users-table tr").forEach(row => {
            const val = row.getAttribute("data-filter");
            row.style.display = val.includes(query) ? "" : "none";
        });
        this.updateTableCounter();
    },

    updateTableCounter() {
        const count = document.querySelectorAll("#dom-target-users-table tr:not([style*='display: none'])").length;
        document.getElementById("lbl-displayed-user-count").innerText = count;
    },

    wipeTotalDatabase() {
        if (ApplicationState.activeSession.r !== "ROOT_ADMIN") {
            SystemNotifier.trigger("Root key execution required.", "error");
            return;
        }
        if (confirm("Reset total system storage structures?")) {
            localStorage.clear();
            window.location.reload();
        }
    }
};

const GeneratorEngine = {
    handleBinInput() {
        let val = document.getElementById("inp-gen-bin").value.replace(/\D/g, '');
        document.getElementById("inp-gen-bin").value = val;
        const previewNum = document.getElementById("preview-dom-card-number");
        const previewBrand = document.getElementById("preview-dom-card-brand");
        if (val.length === 0) { previewNum.innerText = "4000 1234 5678 9010"; return; }
        previewBrand.innerText = val.startsWith("4") ? "VISA" : val.startsWith("5") ? "MASTERCARD" : "AMEX";
        let padded = val.padEnd(16, "X");
        previewNum.innerText = padded.match(/.{1,4}/g).join(" ");
    },

    executeGeneration() {
        const bin = document.getElementById("inp-gen-bin").value.trim();
        let qty = parseInt(document.getElementById("inp-gen-quantity").value) || 10;
        let mSel = document.getElementById("slc-gen-month").value;
        let ySel = document.getElementById("slc-gen-year").value;
        let cvvInp = document.getElementById("inp-gen-cvv").value.trim();

        if (bin.length < 6) {
            SystemNotifier.trigger("BIN configuration mismatch.", "error");
            return;
        }

        let items = [];
        for (let k = 0; k < qty; k++) {
            let num = bin;
            while (num.length < 15) { num += Math.floor(Math.random() * 10); }
            let sum = 0;
            for (let i = 0; i < num.length; i++) {
                let d = parseInt(num.charAt(num.length - 1 - i));
                if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
                sum += d;
            }
            let checkDigit = ((Math.floor(sum / 10) + 1) * 10 - sum) % 10;
            num += checkDigit;

            let mm = mSel === "RND" ? String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') : mSel;
            let yyyy = ySel === "RND" ? String(Math.floor(Math.random() * 6) + 2026) : ySel;
            let cvv = cvvInp === "RND" || cvvInp === "" ? String(Math.floor(Math.random() * 899) + 100) : cvvInp;

            items.push(`${num}|${mm}|${yyyy}|${cvv}`);
        }

        document.getElementById("terminal-output-area").innerText = items.join("\n");
        const spl = items[0].split("|");
        document.getElementById("preview-dom-card-number").innerText = spl[0].match(/.{1,4}/g).join(" ");
        document.getElementById("preview-dom-card-expiry").innerText = `${spl[1]}/${spl[2].substring(2)}`;

        ApplicationState.operationsCount += qty;
        AdminPanelEngine.reloadStatistics();
        SystemNotifier.trigger(`Buffered ${qty} generated streams.`);
    },

    clearTerminal() {
        document.getElementById("terminal-output-area").innerText = "Data space flushed.";
    },

    copyAllResults() {
        const text = document.getElementById("terminal-output-area").innerText;
        if (text.includes("Awaiting") || text.includes("flushed")) return;
        navigator.clipboard.writeText(text).then(() => {
            SystemNotifier.trigger("Copied payload arrays.");
        });
    }
};

window.addEventListener("DOMContentLoaded", () => {
    AuthEngine.initDatabase();
    UIEngine.loadPersistedThemeAndWallpaper();

    setInterval(() => {
        const timeDOM = document.getElementById("live-server-time");
        if (timeDOM) {
            const d = new Date();
            timeDOM.innerText = d.toISOString().substring(11, 19) + " UTC";
        }
    }, 1000);

    document.getElementById("chk-set-debug").addEventListener("change", (e) => { ApplicationState.debugMode = e.target.checked; });

    let p = 0;
    const fill = document.getElementById("loading-bar-fill");
    const txt = document.getElementById("preloader-pct");
    const loop = setInterval(() => {
        p += Math.floor(Math.random() * 25) + 10;
        if (p >= 100) {
            p = 100;
            clearInterval(loop);
            setTimeout(() => {
                document.getElementById("sys-preloader").remove();
            }, 100);
        }
        fill.style.width = `${p}%`;
        txt.innerText = `${p}%`;
    }, 30);
});
