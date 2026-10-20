"use client";

import React from "react";
import { useCheckout } from "./useCheckout";
import CheckoutScreen from "./_components/CheckoutScreen";

export default function CheckoutPage() {
  return <CheckoutScreen c={useCheckout()} />;
}
