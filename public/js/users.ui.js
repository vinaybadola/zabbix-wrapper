users.forEach(user => {
    const tr = document.createElement("tr");

    const actionsTd = document.createElement("td");

    // Edit button
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener('click', () => {
        openEditUserModal(user);
    });

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.style.marginLeft = "8px";
    deleteButton.style.color = "red";

    deleteButton.addEventListener("click", async () => {
        const confirmDelete = confirm(
            `Are you sure you want to delete user "${user.username}"?`
        );

        if (!confirmDelete) return;

        try {
            const response = await deleteUser(user.userid);

            if (!response.ok) {
                const err = await response.json();
                alert(err.message || "Failed to delete user");
                return;
            }

            await fetchUsers(); // refresh table
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    });

    actionsTd.appendChild(editButton);
    actionsTd.appendChild(deleteButton);

    tr.innerHTML = `
        <td>${user.userid}</td>
        <td>${user.username}</td>
        <td>${user.name || "-"}</td>
        <td>${user.surname || "-"}</td>
        <td>${user.role?.name || "-"}</td>
    `;

    tr.appendChild(actionsTd);
    usersTableBody.appendChild(tr);
});
