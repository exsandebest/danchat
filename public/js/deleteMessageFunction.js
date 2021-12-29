Array.from(messagesElements).forEach((element) => {
    element.removeEventListener('dblclick', deleteMessage);
    element.addEventListener('dblclick', deleteMessage);
});

function deleteMessage(event) {
    if (!confirm(`Вы действительно хотите удалить это сообщение?`)) return;
    let messageId = event.target.getAttribute("idx");
    fetch("/admin/delete/message", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
            messageId: messageId
        })
    }).then(res => {
        if (!res.ok) {
            error(res.status);
        } else {
            res.json().then(data => {
                if (data.status) {
                    event.target.nextSibling.remove();
                    event.target.remove();
                } else {
                    error(data.text || data);
                }
            }).catch(err => error(err));
        }
    }).catch(err => error(err));
}
