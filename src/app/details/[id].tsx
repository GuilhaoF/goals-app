// LIBS
import React, { useEffect, useRef, useState } from "react";
import { Alert, Keyboard, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Bottom from "@gorhom/bottom-sheet";
import dayjs from "dayjs";

// COMPONENTS
import { Input } from "@/components/Input";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { Progress } from "@/components/Progress";
import { BackButton } from "@/components/BackButton";
import { BottomSheet } from "@/components/BottomSheet";
import { Transactions } from "@/components/Transactions";
import { TransactionProps } from "@/components/Transaction";
import { TransactionTypeSelect } from "@/components/TransactionTypeSelect";

//DATABASE
import { useGoalRepository } from "@/database/useGoalRepository";
import { useTransactionRepository } from "@/database/useTransactionRepository";

// UTILS
import { currencyFormat } from "@/utils/currencyFormat";
import { DeleteButton } from "@/components/DeleteButton";

type Details = {
  name: string;
  total: string;
  current: string;
  percentage: number;
  transactions: TransactionProps[];
};

export default function Details() {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState<"up" | "down">("up");
  const [goal, setGoal] = useState<Details>({} as Details);

  // PARAMS
  const routeParams = useLocalSearchParams();
  const goalId = Number(routeParams.id);

  //DATABASE
  const useGoal = useGoalRepository();
  const useTransaction = useTransactionRepository();

  // BOTTOM SHEET
  const bottomSheetRef = useRef<Bottom>(null);
  const handleBottomSheetOpen = () => bottomSheetRef.current?.expand();
  const handleBottomSheetClose = () => bottomSheetRef.current?.snapToIndex(0);

  function fetchDetails() {
    try {
      if (goalId) {
        const goal = useGoal.show(goalId);
        const transactions = useTransaction.findByGoal(goalId);

        if (!goal || !transactions) {
          return router.back();
        }

        setGoal({
          name: goal.name,
          current: currencyFormat(goal.current),
          total: currencyFormat(goal.total),
          percentage: (goal.current / goal.total) * 100,
          transactions: transactions.map((item) => ({
            ...item,
            date: dayjs(item.created_at).format("DD/MM/YYYY [às] HH:mm"),
          })),
        });

        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function handleNewTransaction() {
    try {
      let amountAsNumber = Number(amount.replace(",", "."));

      if (isNaN(amountAsNumber)) {
        return Alert.alert("Erro", "Valor inválido.");
      }

      if (type === "down") {
        amountAsNumber = amountAsNumber * -1;
      }

      useTransaction.create({ goalId, amount: amountAsNumber });

      Alert.alert("Sucesso", "Transação registrada!");

      handleBottomSheetClose();
      Keyboard.dismiss();

      setAmount("");
      setType("up");
      fetchDetails();
    } catch (error) {
      console.log(error);
    }
  }

  async function handleDeteleGoal() {
    if (goalId) {
      Alert.alert("Alerta", "Deseja deletar essa meta?", [
        { style: "cancel", text: "Não" },
        {
          text: "Sim",
          onPress: () => {
            useGoal.deleteGoal(goalId);
            useTransaction.deleteByGoal(goalId);
            router.push("/");
          },
        },
      ]);
    }
  }

  useEffect(() => {
    fetchDetails();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View className="flex-1 p-8 pt-12">
      <View className="pt-4 px-4 flex-row justify-between">
        <BackButton />
        <DeleteButton onPress={handleDeteleGoal} />
      </View>
      <Header title={goal.name} subtitle={`${goal.current} de ${goal.total}`} />
      <Progress percentage={goal.percentage} />
      <Transactions transactions={goal.transactions} />
      <Button title="Nova transação" onPress={handleBottomSheetOpen} />
      <BottomSheet
        ref={bottomSheetRef}
        title="Nova transação"
        snapPoints={[0.01, 284]}
        onClose={handleBottomSheetClose}
      >
        <TransactionTypeSelect onChange={setType} selected={type} />

        <Input
          placeholder="Valor"
          keyboardType="numeric"
          onChangeText={setAmount}
          value={amount}
        />

        <Button title="Confirmar" onPress={handleNewTransaction} />
      </BottomSheet>
    </View>
  );
}
