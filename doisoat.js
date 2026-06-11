const API_URL = "https://script.google.com/macros/s/AKfycbwjEXHdkX2lbYRW7zNvY1es07tC8-t4x0jPqhd4zk4JJ9fylHH69i5Myv-XSV74v44x/exec";

let resultData = [];
let currentPage = 1;
let totalPages = 1;
let totalRows = 0;
let currentLimit = 100;

function formatMoney(value){
    return Number(value || 0).toLocaleString("vi-VN");
}

function parseMoney(value){
    if(typeof value === "number") return value;

    return Number(
        String(value || "0")
            .replaceAll(".", "")
            .replaceAll(",", "")
            .trim()
    ) || 0;
}

function getSelectedMonth(){
    return document.getElementById("monthFilter").value || "";
}

function getLimit(){
    return Number(document.getElementById("limitSelect").value || 100);
}

async function loadData(page = 1){
    const status = document.getElementById("statusText");

    const month = getSelectedMonth();
    currentLimit = getLimit();
    currentPage = page;

    status.innerText = "Đang tải dữ liệu...";

    try{
        let url = `${API_URL}?page=${currentPage}&limit=${currentLimit}`;

        if(month){
            url += `&month=${month}`;
        }

        const res = await fetch(url);
        const json = await res.json();

        resultData = (json.data || []).map(row => ({
            stt: row["STT"] || "",
            code: row["Mã hồ sơ"] || "",
            date: row["_ngay"] || "",
            fee: parseMoney(row["Số tiền cán bộ thu phí"]),
            bank: parseMoney(row["Số tiền BIDV"]),
            invoice: parseMoney(row["Số tiền Sinvoice"]),
            status: row["Trạng thái"] || "",
            ref: row["Tham chiếu BIDV"] || ""
        }));

        totalRows = json.total || 0;
        totalPages = json.totalPages || 1;
        currentPage = json.page || 1;

        renderTable(resultData);

        status.innerText = `Đã tải ${resultData.length}/${totalRows} hồ sơ`;

        document.getElementById("pageInfo").innerText =
            `Trang ${currentPage} / ${totalPages || 1}`;

    }catch(error){
        console.error(error);
        status.innerText = "Không tải được dữ liệu";
        alert("Không tải được dữ liệu từ Google Sheet.");
    }
}

function renderTable(data){
    const tbody = document.querySelector("#resultTable tbody");
    tbody.innerHTML = "";

    let totalFee = 0;
    let totalBank = 0;
    let totalInvoice = 0;
    let matched = 0;
    let review = 0;

    data.forEach((item, index)=>{
        totalFee += item.fee;
        totalBank += item.bank;
        totalInvoice += item.invoice;

        if(item.status === "Matched") matched++;
        if(item.status === "Needs Review") review++;

        const statusClass =
            item.status === "Matched"
            ? "matched"
            : "review";

        tbody.innerHTML += `
            <tr>
                <td>${item.stt || ((currentPage - 1) * currentLimit + index + 1)}</td>
                <td>${item.code}</td>
                <td>${item.date}</td>
                <td>${formatMoney(item.fee)}</td>
                <td>${formatMoney(item.bank)}</td>
                <td>${formatMoney(item.invoice)}</td>
                <td class="status ${statusClass}">${item.status}</td>
                <td>${item.ref}</td>
            </tr>
        `;
    });

    document.getElementById("tongHoSo").innerText = totalRows;
    document.getElementById("tongMatched").innerText = matched;
    document.getElementById("tongReview").innerText = review;

    document.getElementById("totalFee").innerText = formatMoney(totalFee);
    document.getElementById("totalBank").innerText = formatMoney(totalBank);
    document.getElementById("totalInvoice").innerText = formatMoney(totalInvoice);

    document.getElementById("totalFeeBox").innerText = formatMoney(totalFee);
    document.getElementById("totalBankBox").innerText = formatMoney(totalBank);
    document.getElementById("totalInvoiceBox").innerText = formatMoney(totalInvoice);
}

function refreshData(){
    loadData(1);
}

function changeMonth(){
    loadData(1);
}

function changeLimit(){
    loadData(1);
}

function prevPage(){
    if(currentPage > 1){
        loadData(currentPage - 1);
    }
}

function nextPage(){
    if(currentPage < totalPages){
        loadData(currentPage + 1);
    }
}

function setDefaultMonth(){
    const input = document.getElementById("monthFilter");

    if(!input.value){
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        input.value = `${y}-${m}`;
    }
}

setDefaultMonth();
loadData(1);
