import{a3 as z,H as c,B as l,l as x,y as N}from"./index-cP8fjh4g.js";import{e as T}from"./salePricing-O5y81QDO.js";const R=(t,e)=>String(e==="FC"?Math.round(t):Number(t.toFixed(2)));function E(t,e){const n=t.trim().replace(/\s/g,"").replace(",",".");if(!/^\d+(\.\d+)?$/.test(n))return"invalid";const o=Number(n);return!Number.isFinite(o)||o<=0||e==="FC"&&!Number.isInteger(o)||e==="USD"&&Math.abs(o*100-Math.round(o*100))>1e-9?"invalid":o}function H({id:t,value:e,currency:n,ariaLabel:o,error:r,disabled:u,className:g="w-28",onCommit:b}){const{t:k}=z(),[h,f]=c.useState(null),[F,v]=c.useState(!1),w=c.useRef(""),d=c.useRef(!1),S=h??R(e,n),s=F?k(n==="FC"?"pos.invalidFcPrice":"pos.invalidUsdPrice"):r,$=`${t}-error`,C=()=>{if(h===null)return;const a=h;if(f(null),d.current){d.current=!1;return}if(a.trim()===w.current||a.trim()==="")return;const y=E(a,n);if(y==="invalid"){v(!0);return}b(y)},P=a=>{a.key==="Enter"?(a.preventDefault(),a.currentTarget.blur()):a.key==="Escape"&&(d.current=!0,a.currentTarget.blur())};return l.jsxs("div",{className:"unit-price-input",children:[l.jsxs("div",{className:"flex items-center justify-end gap-1",children:[l.jsx("input",{id:t,type:"text",inputMode:n==="FC"?"numeric":"decimal",autoComplete:"off","aria-label":o,"aria-invalid":s?!0:void 0,"aria-describedby":s?$:void 0,value:S,disabled:u,onFocus:()=>{const a=R(e,n);w.current=a,d.current=!1,v(!1),f(a)},onChange:a=>f(a.target.value),onBlur:C,onKeyDown:P,className:`min-w-0 rounded-md border px-2 py-1.5 text-right tabular-nums ${s?"border-red-500 bg-red-50":"border-gray-300"} ${g}`}),l.jsx("span",{className:"text-xs font-medium text-gray-600",children:n})]}),s&&l.jsx("p",{id:$,role:"alert",className:"mt-1 text-xs text-red-600 text-right",children:s})]})}const j={title:"saleReceipt.title",stubTitle:"saleReceipt.stubTitle",tagline:"saleReceipt.tagline",tel:"saleReceipt.tel",date:"saleReceipt.date",receiptNo:"saleReceipt.receiptNo",customer:"saleReceipt.customer",phone:"saleReceipt.phone",email:"saleReceipt.email",itemsBought:"saleReceipt.itemsBought",itemsSold:"saleReceipt.itemsSold",item:"saleReceipt.columns.item",unitPrice:"saleReceipt.columns.unitPrice",qty:"saleReceipt.columns.qty",total:"saleReceipt.columns.total",subtotal:"saleReceipt.subtotal",saleTotal:"saleReceipt.saleTotal",payment:"saleReceipt.payment",agent:"saleReceipt.agent",thanks:"saleReceipt.thanks",noExchange:"saleReceipt.noExchange",noRefund:"saleReceipt.noRefund",stubNo:"saleReceipt.stubNo",stubNumber:"saleReceipt.stubNumberOfDay",stubFooter:"saleReceipt.stubFooter",keepStub:"saleReceipt.keepStub",receiptNoShort:"saleReceipt.receiptNoShort",dateShort:"saleReceipt.dateShort"};function q(t=x()){const e=N.getFixedT(t),n={};for(const[o,r]of Object.entries(j))n[o]=e(r,{number:"{{number}}"});return n}function L(t,e=x()){const n=String(t||"");return N.getFixedT(e)(`saleReceipt.payments.${n}`,{defaultValue:n.toUpperCase()})}function U(t,e){return t.map(n=>{const o=Number(n.quantity)||0,r=T(n,e);return{name:String(n.name??""),quantity:o,unitFC:r,totalFC:r===void 0?void 0:r*o}})}function D(t){if(!(!t.length||t.some(e=>e.totalFC===void 0)))return t.reduce((e,n)=>e+(n.totalFC??0),0)}function m(t){return t==null||!Number.isFinite(t)?"—":`${String(Math.round(t)).replace(/\B(?=(\d{3})+(?!\d))/g,",")} FC`}function O(t,e=x()){const n=U(t.items,t.exchangeRate),o=D(n);return{...t,language:e,labels:q(e),lines:n,subtotalFC:o,totalFC:o,paymentLabel:L(t.paymentMethod,e)}}function K(t){const{labels:e}=t;return{shopName:t.shopName,shopAddress:t.shopAddress,shopNumber:t.shopNumber,shopRegistration:t.shopRegistration,receiptFooter:t.receiptFooter,customerName:t.customerName,customerPhone:t.customerPhone??"",customerEmail:t.customerEmail,items:t.items,exchangeRate:t.exchangeRate,paymentMethod:t.paymentMethod,paymentLabel:t.paymentLabel,salesPerson:t.salesPerson,date:t.date,receiptNumber:t.receiptNumber,stubNumber:t.stubNumber??t.receiptNumber,language:t.language,labels:{tagline:e.tagline,date:e.dateShort,receiptNo:e.receiptNoShort,customer:e.customer,phone:e.phone,email:e.email,item:e.item,unitPrice:e.unitPrice,qty:e.qty,total:e.total,subtotal:e.subtotal,saleTotal:e.saleTotal,payment:e.payment,agent:e.agent,thanks:e.thanks,noExchange:`${e.noExchange} - ${e.noRefund}`,stubTitle:e.stubTitle.toUpperCase(),stubNumber:e.stubNumber}}}function i(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}const I=t=>`
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Courier New', Courier, monospace;
        margin: 0; padding: 0;
        font-size: 12px; font-weight: bold; line-height: 1.2;
        width: 80mm; background-color: white;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .receipt-container { width: 78mm; margin: 0 auto; padding: 1mm 2mm; border: none; text-align: center; position: relative; }
      .logo-watermark {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background-image: url('${t}/newlogo.png');
        background-repeat: no-repeat; background-position: center; background-size: 65%;
        opacity: 0.18; pointer-events: none; z-index: 0;
      }
      .content-wrapper { position: relative; z-index: 1; }
      .header { text-align: center; margin-bottom: 2mm; padding-bottom: 1mm; border-bottom: 2px double #000; }
      .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 0.5mm; text-transform: uppercase; }
      .shop-details { font-size: 10px; margin-bottom: 0.3mm; line-height: 1.2; font-weight: bold; }
      .receipt-info { margin: 2mm 0; padding: 1mm 2mm; background-color: #f8f8f8; border-left: 3px solid #000; text-align: left; }
      .receipt-title {
        font-size: 11px; font-weight: bold; margin: 1mm 0; text-transform: uppercase;
        background-color: #000; color: white; padding: 1mm 2mm; border-radius: 2px; text-align: center;
      }
      .stub-number {
        font-size: 11px; font-weight: bold; margin: 2mm 0; text-transform: uppercase;
        background-color: #333; color: white; padding: 1mm 2mm; border-radius: 3px;
      }
      .items-table { width: 100%; border-collapse: collapse; font-size: 10px; background-color: #fafafa; }
      .items-table th {
        background-color: #e0e0e0; text-transform: uppercase; font-weight: bold;
        padding: 1mm 0.8mm; border-bottom: 1px solid #999;
      }
      .items-table td { padding: 0.6mm 0.8mm; border-bottom: 1px dotted #ddd; vertical-align: top; font-weight: bold; }
      .items-table .col-article { text-align: left; overflow-wrap: anywhere; word-break: break-word; }
      .items-table .col-pu, .items-table .col-total { text-align: right; white-space: nowrap; }
      .items-table .col-qte { text-align: center; white-space: nowrap; }
      .total-section { font-weight: bold; margin-top: 2mm; padding: 1mm 2mm; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; }
      .total-row { display: flex; justify-content: space-between; gap: 2mm; margin-bottom: 0.5mm; font-size: 11px; padding: 0 1mm; text-align: left; }
      .total-row > div:last-child { text-align: right; white-space: nowrap; }
      .payment-method { text-transform: uppercase; font-weight: bold; font-size: 11px; color: #000; }
      .footer { text-align: center; margin-top: 2mm; font-size: 10px; font-weight: bold; padding: 1mm 2mm; background-color: #f8f8f8; border-top: 1px dashed #000; }
      .stub-footer { text-align: center; margin-top: 2mm; font-size: 10px; font-weight: bold; padding: 1mm 2mm; background-color: #e8e8e8; border: 1px solid #ccc; border-radius: 3px; }
      .sales-person { margin-top: 2mm; text-align: center; font-weight: bold; font-size: 10px; padding: 1mm 2mm; background-color: #e8e8e8; border: 1px solid #ccc; border-radius: 2px; }
      .customer-info { margin: 2mm 0; padding: 1mm 2mm; font-weight: bold; text-align: left; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; font-size: 10px; }
      .customer-field { margin-bottom: 0.3mm; font-size: 10px; }
      .cut-line { text-align: center; margin: 2mm 0 0 0; font-weight: bold; font-size: 10px; color: #000; letter-spacing: 1px; }
      .thank-you { font-weight: bold; margin: 0.5mm 0; font-size: 10px; }
      .warning { font-size: 9px; color: #000; margin: 0.3mm 0; font-weight: bold; }
      .section-divider { height: 2px; background: linear-gradient(to right, transparent, #000, transparent); margin: 1mm 0; }
      @media print {
        @page { margin: 0 !important; size: 80mm auto !important; }
        body {
          margin: 0 !important; padding: 0 !important; width: 80mm !important; font-size: 12px !important;
          background: white !important; font-weight: bold !important; height: auto !important;
          -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
        }
        .receipt-container { border: none !important; box-shadow: none !important; margin: 0 auto !important; padding: 1mm 2mm !important; width: 78mm !important; }
        .cut-line { page-break-after: always !important; margin-bottom: 0 !important; }
        body::after, body::before { display: none !important; content: none !important; }
      }`;function M(t){const{labels:e}=t,n=t.lines.map(o=>`
          <tr>
            <td class="col-article">${i(o.name)}</td>
            <td class="col-pu">${m(o.unitFC)}</td>
            <td class="col-qte">${o.quantity}</td>
            <td class="col-total">${m(o.totalFC)}</td>
          </tr>`).join("");return`
      <table class="items-table">
        <thead>
          <tr>
            <th class="col-article">${i(e.item)}</th>
            <th class="col-pu">${i(e.unitPrice)}</th>
            <th class="col-qte">${i(e.qty)}</th>
            <th class="col-total">${i(e.total)}</th>
          </tr>
        </thead>
        <tbody>${n}
        </tbody>
      </table>`}const p=(t,e,n="")=>`<div class="total-row"><div><strong>${i(t)}:</strong></div><div${n?` class="${n}"`:""}><strong>${e}</strong></div></div>`;function Y(t,e,n=typeof window>"u"?"":window.location.origin){const{labels:o}=t,r=e==="stub",u=`
      <div class="customer-info">
        <div class="customer-field">${i(o.customer)}: <strong>${i(String(t.customerName??"").toUpperCase())}</strong></div>
        ${t.customerPhone?`<div class="customer-field">${i(o.phone)}: <strong>${i(t.customerPhone)}</strong></div>`:""}
        ${!r&&t.customerEmail?`<div class="customer-field">${i(o.email)}: <strong>${i(t.customerEmail)}</strong></div>`:""}
      </div>`,g=r?p(o.saleTotal,m(t.totalFC)):p(o.subtotal,m(t.subtotalFC))+p(o.total,m(t.totalFC)),b=r?`
      <div class="stub-footer">
        <div class="thank-you"><strong>${i(o.stubFooter)}</strong></div>
        <div class="warning"><strong>${i(t.shopName)}</strong></div>
        <div class="warning"><strong>${i(o.keepStub)}</strong></div>
        <div class="warning">${i(o.receiptNoShort)}: <strong>${i(t.receiptNumber)}</strong></div>
        <div class="warning">${i(o.dateShort)}: <strong>${i(t.date)}</strong></div>
      </div>`:`
      <div class="footer">
        <div class="thank-you"><strong>${i(t.receiptFooter||o.thanks)}</strong></div>
        <div class="warning"><strong>${i(o.noExchange)}</strong></div>
        <div class="warning"><strong>${i(o.noRefund)}</strong></div>
      </div>`;return`<!DOCTYPE html>
<html lang="${t.language}">
  <head>
    <meta charset="utf-8">
    <title>${i(r?o.stubTitle:o.title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${I(n)}
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${i(t.shopName)}</strong></div>
        <div class="shop-details"><strong>${i(t.shopAddress)}</strong></div>
        <div class="shop-details">${i(o.tel)}: <strong>${i(t.shopNumber)}</strong></div>
        ${r?"":`<div class="shop-details"><strong>${i(t.shopRegistration)}</strong></div>`}
      </div>

      <div class="section-divider"></div>

      <div class="receipt-info">
        <div class="shop-details">${i(o.date)}: <strong>${i(t.date)}</strong></div>
        <div class="shop-details">${i(o.receiptNo)}: <strong>${i(t.receiptNumber)}</strong></div>
      </div>
      ${r?`
      <div class="stub-number">${i(o.stubNo)}<strong>${i(t.stubNumber??t.receiptNumber)}</strong></div>`:""}
      ${u}

      <div class="receipt-title">${i(r?o.itemsSold:o.itemsBought)}</div>
      ${M(t)}

      <div class="total-section">
        ${g}
        ${p(o.payment,`${i(t.paymentLabel)}`,"payment-method")}
      </div>

      <div class="sales-person">
        ${i(o.agent)}: <strong>${i(String(t.salesPerson??"").toUpperCase())}</strong>
      </div>
      ${b}

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
      </div>
    </div>
    <script>
      window.onload = function() {
        try {
          window.print();
        } catch(e) {
          console.error('Print error:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    <\/script>
  </body>
</html>
`}function _(t){const e=window.open("","_blank","width=320,height=600");return e?(e.document.write(t),e.document.close(),!0):!1}export{H as U,O as b,K as e,m as f,_ as o,Y as r};
