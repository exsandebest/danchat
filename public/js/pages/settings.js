function save() {
    fetch("/user/change/settings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
            color: document.getElementById("color").value,
            scroll: document.getElementById("scroll").checked
        })
    }).then(res => {
        if (!res.ok) {
            error(res.status);
        } else {
            res.json().then(data => {
                if (data.status) {
                    VanillaToasts.create({
                        title: "Успешно!",
                        text: "Настройки успешно сохранены",
                        timeout: 10000,
                        type: "success"
                    })
                } else {
                    error(data.text || data);
                }
            }).catch(err => error(err));
        }
    }).catch(err => error(err));
}
