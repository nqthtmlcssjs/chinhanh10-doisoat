const API_URL = "https://script.google.com/macros/s/AKfycbwjEXHdkX2lbYRW7zNvY1es07tC8-t4x0jPqhd4zk4JJ9fylHH69i5Myv-XSV74v44x/exec";

let resultData = [];

function formatMoney(value){
    return Number(value || 0).toLocaleString("vi-VN");
}

function formatDateFromApi(value){
    if(!value) return "";

    if(typeof value === "string"){
        const d = new Date(value);
        if(!isNaN(d)) return d.toISOString().slice(0,10);
        return value;
    }

    const d = new Date(value);
    if(!isNaN(d)) return d.toISOString().slice(0,10);

    return "";
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

async function loadDataFromGoogleSheet(){
    const status = document.getElementById("statusText");
    status.innerText = "Đang tải dữ liệu...";

    try{
        const res = await fetch(API_URL);
        const data = await res.json();

        resultData = data
            .filter(row =>
                row["Mã hồ sơ"] &&
                row["Mã hồ sơ"] !== "TỔNG CỘNG"
            )
            .map(row => ({
                stt: row["STT"] || "",
                code: row["Mã hồ sơ"] || "",
                date: formatDateFromApi(row["Ngày thanh toán"]),
                fee: parseMoney(row["Số tiền cán bộ thu phí"]),
                bank: parseMoney(row["Số tiền BIDV"]),
                invoice: parseMoney(row["Số tiền Sinvoice"]),
                status: row["Trạng thái"] || "",
                ref: row["Tham chiếu BIDV"] || ""
            }));

        applyFilter();
        status.innerText = "Đã tải dữ liệu thành công";

    }catch(error){
        console.error(error);
        status.innerText = "Không tải được dữ liệu";
        alert("Không tải được dữ liệu từ Google Sheet.");
    }
}

function applyFilter(){
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;

    let data = resultData;

    if(fromDate){
        data = data.filter(item => item.date >= fromDate);
    }

    if(toDate){
        data = data.filter(item => item.date <= toDate);
    }

    renderTable(data);
}

function renderTable(data){
    const tbody = document.querySelector("#resultTable tbody");
    tbody.innerHTML = "";

    let totalFee = 0;
    let totalBank = 0;
    let totalInvoice = 0;
    let matched = 0;
    let review = 0;

    data.forEach((item,index)=>{
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
                <td>${index + 1}</td>
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

    document.getElementById("tongHoSo").innerText = data.length;
    document.getElementById("tongMatched").innerText = matched;
    document.getElementById("tongReview").innerText = review;

    document.getElementById("totalFee").innerText = formatMoney(totalFee);
    document.getElementById("totalBank").innerText = formatMoney(totalBank);
    document.getElementById("totalInvoice").innerText = formatMoney(totalInvoice);

    document.getElementById("totalFeeBox").innerText = formatMoney(totalFee);
    document.getElementById("totalBankBox").innerText = formatMoney(totalBank);
    document.getElementById("totalInvoiceBox").innerText = formatMoney(totalInvoice);
}

loadDataFromGoogleSheet();
