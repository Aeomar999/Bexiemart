import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
});

export const registerSchema = loginSchema
  .extend({
    name: z.string().min(1, "Name is required"),
    phone: z.string().optional(),
    confirmPassword: z.string().min(6, "Min 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const addressSchema = z.object({
  type: z.string().min(1, "Label is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  phone: z.string().min(1, "Phone is required"),
});

export const checkoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  deliveryMethod: z.string().min(1, "Delivery method is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

export const transferSchema = z.object({
  recipient: z.string().min(1, "Recipient is required"),
  amount: z.number().positive("Amount must be positive"),
  pin: z.string().length(4, "PIN must be 4 digits"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().min(0, "Stock cannot be negative"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
});

export const shopSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  description: z.string().min(1, "Description is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Physical address is required"),
  logo: z.string().optional(),
  banner: z.string().optional(),
});
