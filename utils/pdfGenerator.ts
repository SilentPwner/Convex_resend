// convex/utils/pdfGenerator.ts
import { internalAction } from "../_generated/server";
import { PdfMaker } from "pdf-maker";
import { v } from "convex/values";

export const generatePDFReceipt = internalAction({
  args: {
    donation: v.any(),
    user: v.any(),
    project: v.any()
  },
  handler: async (ctx, args) => {
    const { donation, user, project } = args;
    
    const pdf = new PdfMaker({
      title: user.language === "ar" ? "إيصال تبرع" : "Donation Receipt",
      lang: user.language,
      rtl: user.language === "ar"
    });

    // إضافة محتوى PDF
    pdf.addHeader(
      user.language === "ar" ? "إيصال تبرع" : "Donation Receipt",
      { size: 20, bold: true, align: "center" }
    );

    pdf.addText([
      { text: user.language === "ar" ? "المتبرع:" : "Donor:", bold: true },
      user.name
    ]);

    pdf.addText([
      { text: user.language === "ar" ? "المشروع:" : "Project:", bold: true },
      project.name
    ]);

    pdf.addTable([
      [
        { text: user.language === "ar" ? "المبلغ" : "Amount", bold: true },
        { text: formatCurrency(donation.amount, donation.currency, user.language), bold: true }
      ],
      [
        { text: user.language === "ar" ? "التاريخ" : "Date", bold: true },
        new Date(donation._creationTime).toLocaleDateString(user.language)
      ],
      ...(donation.currency === "BTC" ? [
        [
          { text: user.language === "ar" ? "رقم المعاملة" : "Transaction ID", bold: true },
          donation.txHash
        ]
      ] : [])
    ]);

    if (project.taxDeductible) {
      pdf.addText(
        user.language === "ar" 
          ? "هذا التبرع معفي ضريبي حسب القانون" 
          : "This donation is tax deductible",
        { color: "#4CAF50", align: "center" }
      );
    }

    // إنشاء وتصدير PDF
    return await pdf.generate();
  }
});

function formatCurrency(amount: number, currency: string, language: string): string {
  // نفس الدالة المستخدمة في القالب الإيميل
}