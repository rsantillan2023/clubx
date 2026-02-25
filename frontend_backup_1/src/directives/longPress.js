export default () => ({
    bind: function (el, binding, vNode) {
        // Make sure expression provided is a function
        if (typeof binding.value !== "function") {
            // Fetch name of component
            const compName = vNode.context.name;
            // pass warning to console
            let warn = `[longpress:] provided expression '${binding.expression}' is not a function, but has to be`;
            if (compName) {
                warn += `Found in component '${compName}' `;
            }

            console.warn(warn);
        }

        // Define variable
        let pressTimer = null;

        // Define funtion handlers
        // Create timeout ( run function after 1s )
        let start = (e) => {
            if (e.type === "click" && e.button !== 0) {
                return;
            }

            if (pressTimer === null) {
                pressTimer = setTimeout(() => {
                    // Run function
                    handler();
                }, 1000);
            }
        };

        // Cancel Timeout
        let cancel = (/*e*/) => {
            // Check if timer has a value or not
            if (pressTimer !== null) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };
        // Run Function
        const handler = (e) => {
            binding.value(e);
            const canVibrate = window.navigator.vibrate;
            if (canVibrate) window.navigator.vibrate(100);

            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                setTimeout(function () {
                    el.click();
                }, 500);
            }
        }

        ["mousedown", "touchstart"].forEach((e) => {
            el.addEventListener(e, start, { passive: true });
        });

        ["click", "mouseout", "touchend", "touchcancel"].forEach((e) => {
            el.addEventListener(e, cancel, { passive: true });
        });
    }
});