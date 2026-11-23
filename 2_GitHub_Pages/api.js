// ============================================================
//  api.js — Єдина точка зв'язку між GitHub Pages та Google Apps Script
// ============================================================

// 1. Вставте сюди ваш URL веб-додатку Google Apps Script (закінчується на /exec):
var GAS_API_URL = "https://script.google.com/macros/s/ТВОЙ_URL_APPS_SCRIPT/exec";

// 2. Беремо ключ доступу із URL (?key=...), а якщо відкрито як окремий додаток — із пам'яті пристрою
var _params = new URLSearchParams(window.location.search);
var _urlKey = _params.get("key") || "";
if (_urlKey) {
  try { localStorage.setItem("pp_crm_key", _urlKey); } catch (e) {}
}
window.KEY = _urlKey || (function() {
  try { return localStorage.getItem("pp_crm_key") || ""; } catch (e) { return ""; }
})();

// 3. Емулятор google.script.run поверх швидкого fetch POST
window.google = {
  script: {
    run: (function() {
      var METHODS = [
        "crmGetData", "crmSetStatus", "crmEdit", "crmTogglePriority",
        "crmAddOrder", "crmGetUsers", "crmUserAction", "crmSaveUserPerms",
        "crmUndoStatus", "crmGetLogs", "crmLogin"
      ];
      function runner(ok, fail) {
        var api = {
          withSuccessHandler: function(fn) { return runner(fn, fail); },
          withFailureHandler: function(fn) { return runner(ok, fn); }
        };
        METHODS.forEach(function(method) {
          api[method] = function() {
            if (!GAS_API_URL || GAS_API_URL.indexOf("ТВОЙ_URL_APPS_SCRIPT") > -1) {
              if (fail) fail(new Error("Вкажіть ваш /exec URL у файлі api.js на GitHub!"));
              return;
            }
            var allArgs = Array.prototype.slice.call(arguments);
            var keyArg  = allArgs[0] || window.KEY;
            var restArgs = allArgs.slice(1);
            fetch(GAS_API_URL + "?api=1", {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify({ fn: method, key: keyArg, args: restArgs }),
              redirect: "follow"
            })
              .then(function(r) { return r.json(); })
              .then(function(d) {
                if (d && d.ok) { if (ok) ok(d.result); }
                else { if (fail) fail(new Error((d && d.error) || "Помилка API")); }
              })
              .catch(function(e) { if (fail) fail(e); });
          };
        });
        return api;
      }
      return runner(null, null);
    })()
  }
};
