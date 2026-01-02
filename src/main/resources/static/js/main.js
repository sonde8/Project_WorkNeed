document.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById("todayStart");
    if (!el) return;

    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    el.textContent = `${yyyy}. ${mm}. ${dd}`;
});