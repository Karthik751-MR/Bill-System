"use client";

import { useState, useEffect } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Save,
  Download,
  Eye,
  EyeOff,
  User,
  FileText,
  Calculator,
  Trash2,
  Copy,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Customer {
  name: string;
  address: string;
  gstin: string;
  stateName: string;
  stateCode: string;
  email?: string;
  phone?: string;
}

interface Item {
  slNo: number;
  noOfPkgs: number;
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  per: string;
  amount: number;
}

interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  gstin: string;
  stateName: string;
  stateCode: string;
  email: string;
  pan: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  branch: string;
}

const defaultCompany: CompanyDetails = {
  name: "MOORTHY STEEL CENTRE",
  address:
    "NO.40/3,Mariamman Koil Street,\nAngamuthu Nagar, Padi,\nChennai -600 050.",
  phone: "9841512507/9884110847",
  gstin: "33AONPD5111L1Z4",
  stateName: "Tamil Nadu",
  stateCode: "33",
  email: "moorthysteelcentre09@gmail.com",
  pan: "AONPD5111L",
  bankName: "Bank of Baroda",
  accountNo: "05330500000098",
  ifscCode: "BARB0AMBATT",
  branch: "Ambattur, Chennai & BARB0AMBATT",
};

const itemSuggestions = [
  "Alloy Steel Flats,Rounds & Squares",
  "MS Round Bar",
  "SS Round Bar",
  "MS Flat Bar",
  "MS Square Bar",
  "Cutting Charges",
  "Labour Charges",
];

const hsnCodes = {
  "7228": "Other bars and rods of alloy steel",
  "9988": "Services",
  "7214": "Other bars and rods of iron or non-alloy steel",
};

export default function InvoiceGenerator() {
  const [company, setCompany] = useState<CompanyDetails>(defaultCompany);
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("customers") || "[]");
    }
    return [];
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerGstin, setBuyerGstin] = useState("");
  const [buyerStateName, setBuyerStateName] = useState("");
  const [buyerStateCode, setBuyerStateCode] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  const [invoiceNo, setInvoiceNo] = useState("MSC\\25-26\\142");
  const [dated, setDated] = useState(
    new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-")
  );
  const [modeTerms, setModeTerms] = useState("Immediate");
  const [supplierRef, setSupplierRef] = useState("");
  const [otherRef, setOtherRef] = useState("");
  const [buyerOrderNo, setBuyerOrderNo] = useState("verbal");
  const [orderDated, setOrderDated] = useState("30-Apr-2025");
  const [despatchDocNo, setDespatchDocNo] = useState("");
  const [deliveryNoteDate, setDeliveryNoteDate] = useState("");
  const [despatchedThrough, setDespatchedThrough] = useState("By Hand");
  const [destination, setDestination] = useState("Chennai");
  const [termsOfDelivery, setTermsOfDelivery] = useState("Immediate");

  const [items, setItems] = useState<Item[]>([
    {
      slNo: 1,
      noOfPkgs: 1,
      description: "",
      hsn: "7228",
      quantity: 0,
      rate: 0,
      per: "kgs",
      amount: 0,
    },
  ]);

  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState("buyer");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("customers", JSON.stringify(customers));
  }, [customers]);

  const addItem = () => {
    const newItem: Item = {
      slNo: items.length + 1,
      noOfPkgs: 1,
      description: "",
      hsn: "7228",
      quantity: 0,
      rate: 0,
      per: "kgs",
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      newItems.forEach((item, i) => {
        item.slNo = i + 1;
      });
      setItems(newItems);
    }
  };

  const updateItem = (
    index: number,
    field: keyof Item,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    const qty = newItems[index].quantity || 0;
    const rate = newItems[index].rate || 0;
    newItems[index].amount = qty * rate;

    setItems(newItems);
  };

  const duplicateItem = (index: number) => {
    const itemToDuplicate = { ...items[index] };
    itemToDuplicate.slNo = items.length + 1;
    setItems([...items, itemToDuplicate]);
  };

  const saveCustomer = () => {
    if (!buyerName.trim() || !buyerAddress.trim()) {
      toast.error("Please fill buyer name and address");
      return;
    }

    const customer: Customer = {
      name: buyerName,
      address: buyerAddress,
      gstin: buyerGstin,
      stateName: buyerStateName,
      stateCode: buyerStateCode,
      email: buyerEmail,
      phone: buyerPhone,
    };

    const existingIndex = customers.findIndex((c) => c.name === buyerName);
    const newCustomers = [...customers];

    if (existingIndex !== -1) {
      newCustomers[existingIndex] = customer;
      toast.success("Customer updated successfully");
    } else {
      newCustomers.push(customer);
      toast.success("Customer saved successfully");
    }

    setCustomers(newCustomers);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setBuyerName(customer.name);
    setBuyerAddress(customer.address);
    setBuyerGstin(customer.gstin);
    setBuyerStateName(customer.stateName);
    setBuyerStateCode(customer.stateCode);
    setBuyerEmail(customer.email || "");
    setBuyerPhone(customer.phone || "");
  };

  const clearBuyer = () => {
    setSelectedCustomer(null);
    setBuyerName("");
    setBuyerAddress("");
    setBuyerGstin("");
    setBuyerStateName("");
    setBuyerStateCode("");
    setBuyerEmail("");
    setBuyerPhone("");
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const total = subtotal + cgst + sgst;

    return {
      subtotal,
      cgst,
      sgst,
      total,
      totalQty,
    };
  };

  const numberToWords = (num: number): string => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";

    const convertHundreds = (n: number): string => {
      let result = "";
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + " ";
        return result;
      }
      if (n > 0) {
        result += ones[n] + " ";
      }
      return result;
    };

    const integer = Math.floor(num);
    const decimal = Math.round((num - integer) * 100);

    let result = "";
    const crores = Math.floor(integer / 10000000);
    const lakhs = Math.floor((integer % 10000000) / 100000);
    const thousandsVal = Math.floor((integer % 100000) / 1000);
    const hundreds = integer % 1000;

    if (crores > 0) result += convertHundreds(crores) + "Crore ";
    if (lakhs > 0) result += convertHundreds(lakhs) + "Lakh ";
    if (thousandsVal > 0) result += convertHundreds(thousandsVal) + "Thousand ";
    if (hundreds > 0) result += convertHundreds(hundreds);

    result = result.trim();
    if (decimal > 0) {
      result += " and " + convertHundreds(decimal) + "Paise";
    }

    return result + " Only";
  };

  const exportToPDF = async () => {
    const element = document.getElementById("invoice-preview");
    if (!element) {
      toast.error("Invoice preview not found");
      console.error("Element with ID 'invoice-preview' not found");
      return;
    }

    try {
      toast.info("Generating PDF...");
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight > pdfHeight) {
        const totalPages = Math.ceil(imgHeight / pdfHeight);
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) pdf.addPage();
          const yOffset = -(i * pdfHeight * canvas.width) / pdfWidth;
          pdf.addImage(imgData, "PNG", 0, yOffset, imgWidth, imgHeight);
        }
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }

      const filename = `Invoice_${invoiceNo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      pdf.save(filename);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(`Failed to generate PDF: ${error.message}`);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex h-screen">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div
          className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <h1 className="text-lg font-bold">GST Invoice</h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 border-b">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                  <TabsTrigger
                    value="buyer"
                    className="flex items-center gap-2 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <User className="h-3 w-3" />
                    Buyer
                  </TabsTrigger>
                  <TabsTrigger
                    value="invoice"
                    className="flex items-center gap-2 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <FileText className="h-3 w-3" />
                    Invoice
                  </TabsTrigger>
                  <TabsTrigger
                    value="items"
                    className="flex items-center gap-2 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <Calculator className="h-3 w-3" />
                    Items
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="flex-1 p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="buyer" className="space-y-4 mt-0">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                        <User className="h-4 w-4" />
                        Buyer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Customer Selection */}
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => {
                            const customer = customers.find(
                              (c) => c.name === value
                            );
                            if (customer) selectCustomer(customer);
                          }}
                        >
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer, index) => (
                              <SelectItem key={index} value={customer.name}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearBuyer}
                          className="h-8 px-2 text-xs bg-transparent"
                        >
                          New
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label
                            htmlFor="buyerName"
                            className="text-xs font-medium"
                          >
                            Buyer Name *
                          </Label>
                          <Input
                            id="buyerName"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            placeholder="Enter buyer name"
                            className="h-8 text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="buyerAddress"
                            className="text-xs font-medium"
                          >
                            Buyer Address *
                          </Label>
                          <Textarea
                            id="buyerAddress"
                            value={buyerAddress}
                            onChange={(e) => setBuyerAddress(e.target.value)}
                            placeholder="Enter complete address"
                            rows={3}
                            className="text-xs mt-1 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label
                              htmlFor="buyerEmail"
                              className="text-xs font-medium"
                            >
                              Email
                            </Label>
                            <Input
                              id="buyerEmail"
                              type="email"
                              value={buyerEmail}
                              onChange={(e) => setBuyerEmail(e.target.value)}
                              placeholder="buyer@example.com"
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="buyerPhone"
                              className="text-xs font-medium"
                            >
                              Phone
                            </Label>
                            <Input
                              id="buyerPhone"
                              value={buyerPhone}
                              onChange={(e) => setBuyerPhone(e.target.value)}
                              placeholder="9876543210"
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label
                              htmlFor="buyerGstin"
                              className="text-xs font-medium"
                            >
                              GSTIN/UIN
                            </Label>
                            <Input
                              id="buyerGstin"
                              value={buyerGstin}
                              onChange={(e) =>
                                setBuyerGstin(e.target.value.toUpperCase())
                              }
                              placeholder="33AAAAA0000A1Z5"
                              maxLength={15}
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="buyerStateName"
                              className="text-xs font-medium"
                            >
                              State
                            </Label>
                            <Input
                              id="buyerStateName"
                              value={buyerStateName}
                              onChange={(e) =>
                                setBuyerStateName(e.target.value)
                              }
                              placeholder="Tamil Nadu"
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="buyerStateCode"
                              className="text-xs font-medium"
                            >
                              Code
                            </Label>
                            <Input
                              id="buyerStateCode"
                              value={buyerStateCode}
                              onChange={(e) =>
                                setBuyerStateCode(e.target.value)
                              }
                              placeholder="33"
                              maxLength={2}
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                        </div>

                        <Button
                          onClick={saveCustomer}
                          className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
                        >
                          <Save className="mr-2 h-3 w-3" />
                          Save Customer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="invoice" className="space-y-4 mt-0">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                        <FileText className="h-4 w-4" />
                        Invoice Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label
                            htmlFor="invoiceNo"
                            className="text-xs font-medium"
                          >
                            Invoice No.
                          </Label>
                          <Input
                            id="invoiceNo"
                            value={invoiceNo}
                            onChange={(e) => setInvoiceNo(e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="dated"
                            className="text-xs font-medium"
                          >
                            Dated
                          </Label>
                          <Input
                            id="dated"
                            value={dated}
                            onChange={(e) => setDated(e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label
                            htmlFor="modeTerms"
                            className="text-xs font-medium"
                          >
                            Mode/Terms
                          </Label>
                          <Input
                            id="modeTerms"
                            value={modeTerms}
                            onChange={(e) => setModeTerms(e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="supplierRef"
                            className="text-xs font-medium"
                          >
                            Supplier's Ref.
                          </Label>
                          <Input
                            id="supplierRef"
                            value={supplierRef}
                            onChange={(e) => setSupplierRef(e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label
                            htmlFor="buyerOrderNo"
                            className="text-xs font-medium"
                          >
                            Buyer's Order No.
                          </Label>
                          <Input
                            id="buyerOrderNo"
                            value={buyerOrderNo}
                            onChange={(e) => setBuyerOrderNo(e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="orderDated"
                            className="text-xs font-medium"
                          >
                            Dated
                          </Label>
                          <Input
                            id="orderDated"
                            value={orderDated}
                            onChange={(e) => setOrderDated(e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label
                            htmlFor="despatchDocNo"
                            className="text-xs font-medium"
                          >
                            Despatch Doc No.
                          </Label>
                          <Input
                            id="despatchDocNo"
                            value={despatchDocNo}
                            onChange={(e) => setDespatchDocNo(e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="deliveryNoteDate"
                            className="text-xs font-medium"
                          >
                            Delivery Note Date
                          </Label>
                          <Input
                            id="deliveryNoteDate"
                            value={deliveryNoteDate}
                            onChange={(e) =>
                              setDeliveryNoteDate(e.target.value)
                            }
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label
                            htmlFor="despatchedThrough"
                            className="text-xs font-medium"
                          >
                            Despatched through
                          </Label>
                          <Input
                            id="despatchedThrough"
                            value={despatchedThrough}
                            onChange={(e) =>
                              setDespatchedThrough(e.target.value)
                            }
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="destination"
                            className="text-xs font-medium"
                          >
                            Destination
                          </Label>
                          <Input
                            id="destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="termsOfDelivery"
                          className="text-xs font-medium"
                        >
                          Terms of Delivery
                        </Label>
                        <Input
                          id="termsOfDelivery"
                          value={termsOfDelivery}
                          onChange={(e) => setTermsOfDelivery(e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="items" className="space-y-4 mt-0">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                        <Calculator className="h-4 w-4" />
                        Items & Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <Card
                              key={index}
                              className="border border-slate-200"
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Item {item.slNo}
                                  </Badge>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => duplicateItem(index)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => removeItem(index)}
                                      disabled={items.length === 1}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <Label className="text-xs">
                                      No. of Pkgs
                                    </Label>
                                    <Input
                                      type="number"
                                      value={item.noOfPkgs}
                                      onChange={(e) =>
                                        updateItem(
                                          index,
                                          "noOfPkgs",
                                          Number.parseInt(e.target.value) || 1
                                        )
                                      }
                                      min="1"
                                      className="h-7 text-xs"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-xs">
                                      Description
                                    </Label>
                                    <Select
                                      value={item.description}
                                      onValueChange={(value) =>
                                        updateItem(index, "description", value)
                                      }
                                    >
                                      <SelectTrigger className="h-7 text-xs">
                                        <SelectValue placeholder="Select description" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {itemSuggestions.map(
                                          (suggestion, i) => (
                                            <SelectItem
                                              key={i}
                                              value={suggestion}
                                            >
                                              {suggestion}
                                            </SelectItem>
                                          )
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      value={item.description}
                                      onChange={(e) =>
                                        updateItem(
                                          index,
                                          "description",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Or type custom"
                                      className="h-7 text-xs mt-1"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">HSN/SAC</Label>
                                      <Select
                                        value={item.hsn}
                                        onValueChange={(value) =>
                                          updateItem(index, "hsn", value)
                                        }
                                      >
                                        <SelectTrigger className="h-7 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(hsnCodes).map(
                                            ([code, desc]) => (
                                              <SelectItem
                                                key={code}
                                                value={code}
                                              >
                                                {code} - {desc}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Unit</Label>
                                      <Select
                                        value={item.per}
                                        onValueChange={(value) =>
                                          updateItem(index, "per", value)
                                        }
                                      >
                                        <SelectTrigger className="h-7 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="kgs">
                                            kgs
                                          </SelectItem>
                                          <SelectItem value="pcs">
                                            pcs
                                          </SelectItem>
                                          <SelectItem value="nos">
                                            nos
                                          </SelectItem>
                                          <SelectItem value="mtrs">
                                            mtrs
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <Label className="text-xs">
                                        Quantity
                                      </Label>
                                      <Input
                                        type="number"
                                        step="0.001"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateItem(
                                            index,
                                            "quantity",
                                            Number.parseFloat(e.target.value) ||
                                              0
                                          )
                                        }
                                        className="h-7 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Rate</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={item.rate}
                                        onChange={(e) =>
                                          updateItem(
                                            index,
                                            "rate",
                                            Number.parseFloat(e.target.value) ||
                                              0
                                          )
                                        }
                                        className="h-7 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Amount</Label>
                                      <Input
                                        value={`₹${item.amount.toFixed(2)}`}
                                        readOnly
                                        className="h-7 text-xs bg-slate-50"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>

                      <Button
                        onClick={addItem}
                        className="w-full mt-3 h-8 text-xs"
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Item
                      </Button>

                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            Subtotal:{" "}
                            <span className="font-semibold">
                              ₹{totals.subtotal.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            CGST (9%):{" "}
                            <span className="font-semibold">
                              ₹{totals.cgst.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            SGST (9%):{" "}
                            <span className="font-semibold">
                              ₹{totals.sgst.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-sm font-bold">
                            Total:{" "}
                            <span className="text-green-600">
                              ₹{totals.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2"
            >
              <Menu className="h-4 w-4" />
              Menu
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-between p-4 bg-white border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Invoice Preview
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
              <Button
                size="sm"
                onClick={exportToPDF}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-100 p-4">
            {showPreview && (
              <div className="flex justify-center">
                <div
                  id="invoice-preview"
                  className="bg-white shadow-lg"
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "10px",
                    lineHeight: "1.2",
                    color: "#000",
                    border: "2px solid #000",
                    padding: "8mm",
                  }}
                >
                  <div style={{ textAlign: "center", marginBottom: "8px" }}>
                    <div style={{ fontSize: "9px", marginBottom: "4px" }}>
                      Tax Invoice (Page 4)
                    </div>
                    <div style={{ fontSize: "8px", marginBottom: "8px" }}>
                      (ORIGINAL FOR RECIPIENT)
                    </div>
                  </div>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginBottom: "0",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{
                            width: "50%",
                            verticalAlign: "top",
                            padding: "0",
                            border: "1px solid #000",
                          }}
                        >
                          {/* Seller Section */}
                          <div style={{ padding: "6px" }}>
                            <div
                              style={{
                                fontWeight: "bold",
                                fontSize: "12px",
                                marginBottom: "4px",
                              }}
                            >
                              {company.name}
                            </div>
                            <div style={{ fontSize: "9px", lineHeight: "1.2" }}>
                              {company.address.split("\n").map((line, i) => (
                                <div key={i}>{line}</div>
                              ))}
                              <div>PH- {company.phone}</div>
                              <div>GSTIN/UIN: {company.gstin}</div>
                              <div>
                                State Name : {company.stateName}, Code :{" "}
                                {company.stateCode}
                              </div>
                              <div>E-Mail : {company.email}</div>
                            </div>
                          </div>

                          <div
                            style={{ borderTop: "1px solid #000", margin: "0" }}
                          ></div>

                          {/* Buyer Section */}
                          <div style={{ padding: "6px" }}>
                            <h3
                              style={{
                                fontSize: "10px",
                                fontWeight: "bold",
                                margin: "0 0 4px 0",
                              }}
                            >
                              Buyer
                            </h3>
                            <div style={{ fontSize: "9px" }}>
                              <div
                                style={{
                                  fontWeight: "bold",
                                  marginBottom: "2px",
                                }}
                              >
                                {buyerName}
                              </div>
                              <div
                                style={{
                                  marginBottom: "2px",
                                  whiteSpace: "pre-line",
                                }}
                              >
                                {buyerAddress}
                              </div>
                              <div>GSTIN/UIN:{buyerGstin}</div>
                              <div>
                                State Name : {buyerStateName}, Code :{" "}
                                {buyerStateCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            width: "50%",
                            verticalAlign: "top",
                            padding: "0",
                            border: "1px solid #000",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                            }}
                          >
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Invoice No.</strong>
                                  <br />
                                  {invoiceNo}
                                </td>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Dated</strong>
                                  <br />
                                  {dated}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Delivery Note</strong>
                                </td>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Mode/Terms of Payment</strong>
                                  <br />
                                  {modeTerms}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Supplier's Ref.</strong>
                                  <br />
                                  {supplierRef}
                                </td>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Other Reference(s)</strong>
                                  <br />
                                  {otherRef}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Buyer's Order No.</strong>
                                  <br />
                                  {buyerOrderNo}
                                </td>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Dated</strong>
                                  <br />
                                  {orderDated}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Despatch Document No.</strong>
                                  <br />
                                  {despatchDocNo}
                                </td>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Delivery Note Date</strong>
                                  <br />
                                  {deliveryNoteDate}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Despatched through</strong>
                                  <br />
                                  {despatchedThrough}
                                </td>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Destination</strong>
                                  <br />
                                  {destination}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  <strong>Terms of Delivery</strong>
                                  <br />
                                  {termsOfDelivery}
                                </td>
                                <td
                                  style={{
                                    padding: "3px 6px",
                                    border: "1px solid #000",
                                    fontSize: "9px",
                                  }}
                                >
                                  &nbsp;
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: "0",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f5f5f5" }}>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px",
                            fontSize: "9px",
                            textAlign: "center",
                            width: "6%",
                          }}
                        >
                          Sl No.
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px",
                            fontSize: "9px",
                            textAlign: "center",
                            width: "8%",
                          }}
                        >
                          No. & Kind of Pkgs.
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px",
                            fontSize: "9px",
                            textAlign: "center",
                            width: "35%",
                          }}
                        >
                          Description of Goods
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px",
                            fontSize: "9px",
                            textAlign: "center",
                            width: "10%",
                          }}
                        >
                          HSN/SAC
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px",
                            fontSize: "9px",
                            textAlign: "center",
                            width: "12%",
                          }}
                        >
                          Quantity
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px",
                            fontSize: "9px",
                            textAlign: "center",
                            width: "8%",
                          }}
                        >
                          Rate
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px",
                            fontSize: "9px",
                            textAlign: "center",
                            width: "6%",
                          }}
                        >
                          per
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px",
                            fontSize: "9px",
                            textAlign: "center",
                            width: "15%",
                          }}
                        >
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "3px 2px",
                              fontSize: "8px",
                              textAlign: "center",
                            }}
                          >
                            {item.slNo}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "3px 2px",
                              fontSize: "8px",
                              textAlign: "center",
                            }}
                          >
                            {item.noOfPkgs}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "3px 2px",
                              fontSize: "8px",
                            }}
                          >
                            {item.description}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "3px 2px",
                              fontSize: "8px",
                              textAlign: "center",
                            }}
                          >
                            {item.hsn}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "3px 2px",
                              fontSize: "8px",
                              textAlign: "right",
                            }}
                          >
                            {item.quantity.toFixed(3)} {item.per}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "3px 2px",
                              fontSize: "8px",
                              textAlign: "right",
                            }}
                          >
                            {item.rate.toFixed(2)}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "3px 2px",
                              fontSize: "8px",
                              textAlign: "center",
                            }}
                          >
                            {item.per}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "3px 2px",
                              fontSize: "8px",
                              textAlign: "right",
                            }}
                          >
                            {item.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}

                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                            fontStyle: "italic",
                          }}
                        >
                          Cutting Charges
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          9988
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.045).toFixed(2)}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          CGST 9%
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {totals.cgst.toFixed(2)}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          SGST 9%
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {totals.sgst.toFixed(2)}
                        </td>
                      </tr>

                      <tr style={{ fontWeight: "bold" }}>
                        <td
                          colSpan={4}
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "9px",
                            textAlign: "center",
                          }}
                        >
                          Total
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "9px",
                            textAlign: "right",
                          }}
                        >
                          {totals.totalQty.toFixed(3)} kgs
                        </td>
                        <td
                          colSpan={2}
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "9px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "9px",
                            textAlign: "right",
                          }}
                        >
                          ₹ {totals.total.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div
                    style={{
                      marginBottom: "0",
                      padding: "4px 6px",
                      border: "1px solid #000",
                      borderTop: "none",
                      fontSize: "9px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "6px",
                        fontSize: "9px",
                      }}
                    >
                      E. & O.E
                    </div>
                    <strong>Amount Chargeable (in words)</strong>
                    <br />
                    <strong>INR {numberToWords(totals.total)}</strong>
                  </div>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginBottom: "0",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f5f5f5" }}>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          HSN/SAC
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          Taxable Value
                        </th>
                        <th
                          colSpan={2}
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          Central Tax
                        </th>
                        <th
                          colSpan={2}
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          State Tax
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          Total Tax Amount
                        </th>
                      </tr>
                      <tr style={{ backgroundColor: "#f5f5f5" }}>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "2px",
                            fontSize: "7px",
                          }}
                        >
                          &nbsp;
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "2px",
                            fontSize: "7px",
                          }}
                        >
                          &nbsp;
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "2px",
                            fontSize: "7px",
                            textAlign: "center",
                          }}
                        >
                          Rate
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "2px",
                            fontSize: "7px",
                            textAlign: "center",
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "2px",
                            fontSize: "7px",
                            textAlign: "center",
                          }}
                        >
                          Rate
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "2px",
                            fontSize: "7px",
                            textAlign: "center",
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "2px",
                            fontSize: "7px",
                          }}
                        >
                          &nbsp;
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          7228
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.89).toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          9%
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.89 * 0.09).toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          9%
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.89 * 0.09).toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.89 * 0.18).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          7214
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.068).toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          9%
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.068 * 0.09).toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          9%
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.068 * 0.09).toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.068 * 0.18).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          9988
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.045).toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          9%
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.045 * 0.09).toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          9%
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.045 * 0.09).toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.subtotal * 0.045 * 0.18).toFixed(2)}
                        </td>
                      </tr>
                      <tr style={{ fontWeight: "bold" }}>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                            textAlign: "center",
                          }}
                        >
                          Total
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {totals.subtotal.toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {totals.cgst.toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                          }}
                        >
                          &nbsp;
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {totals.sgst.toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "4px 2px",
                            fontSize: "8px",
                            textAlign: "right",
                          }}
                        >
                          {(totals.cgst + totals.sgst).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginBottom: "0",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{
                            width: "100%",
                            verticalAlign: "top",
                            padding: "6px",
                            border: "1px solid #000",
                            fontSize: "8px",
                            position: "relative",
                          }}
                        >
                          <div style={{ marginBottom: "4px" }}>
                            <strong>
                              Tax Amount (in words) : INR{" "}
                              {numberToWords(totals.cgst + totals.sgst)}
                            </strong>
                          </div>

                          <div style={{ height: "40px" }}></div>

                          <div style={{ display: "flex", width: "100%" }}>
                            <div style={{ width: "50%", paddingRight: "10px" }}>
                              <div style={{ marginBottom: "8px" }}>
                                Company's
                                PAN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:{" "}
                                <strong>AONPD5111L</strong>
                              </div>
                              <div
                                style={{
                                  marginBottom: "4px",
                                  textDecoration: "underline",
                                }}
                              >
                                <strong>Declaration</strong>
                              </div>
                              <div
                                style={{
                                  marginBottom: "8px",
                                }}
                              >
                                <strong>Declaration</strong>
                              </div>
                              <div style={{ lineHeight: "1.5" }}>
                                1)24% interest will be charged in case payment
                                is not made within the allowed credit
                                period.2)goods once sold cannot be taken back
                                without prior approval.3)our responsibility
                                ceases once goods leave our godown
                              </div>
                            </div>
                            <div
                              style={{
                                width: "50%",
                                paddingLeft: "10px",
                                marginTop: "30px",
                              }}
                            >
                              <div style={{ marginBottom: "4px" }}>
                                <strong>Company's Bank Details</strong>
                              </div>
                              <div style={{ marginBottom: "4px" }}>
                                Bank
                                Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:{" "}
                                <strong>Bank of Baroda</strong>
                              </div>
                              <div style={{ marginBottom: "4px" }}>
                                A/c
                                No.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:{" "}
                                <strong>05330500000098</strong>
                              </div>
                              <div>
                                Branch & IFS Code:{" "}
                                <strong>Ambattur, Chennai & BARB0AMBATT</strong>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginBottom: "0",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{
                            width: "50%",
                            verticalAlign: "top",
                            padding: "6px 6px 20px 6px",
                            border: "1px solid #000",
                            borderTop: "none",
                            fontSize: "8px",
                            height: "60px",
                          }}
                        >
                          Customer's Seal and Signature
                        </td>
                        <td
                          style={{
                            width: "50%",
                            verticalAlign: "top",
                            padding: "6px 6px 20px 6px",
                            border: "1px solid #000",
                            borderTop: "none",
                            borderLeft: "none",
                            fontSize: "8px",
                            textAlign: "right",
                            height: "10px",
                            position: "relative",
                          }}
                        >
                          for MOORTHY STEEL CENTRE
                          <div
                            style={{
                              position: "absolute",
                              bottom: "6px",
                              right: "6px",
                            }}
                          >
                            <strong>Authorised Signatory</strong>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "8px",
                      padding: "4px",
                      borderTop: "none",
                    }}
                  >
                    This is a Computer Generated Invoice
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
