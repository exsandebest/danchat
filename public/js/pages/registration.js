'use strict';
setTimeout(() => {
    document.getElementById("notification").setAttribute("style", "opacity:0");
}, 10000);

flatpickr("#birthdate", {
    dateFormat: "d.m.Y",
    maxDate: "today",
    minDate: "01.01.1900",
    locale: "ru"
});
