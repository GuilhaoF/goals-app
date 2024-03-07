import { colors } from "@/styles/colors";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";

export function DeleteButton({ ...rest }: TouchableOpacityProps) {
  return (
    <TouchableOpacity
      className="w-24 h-12  rounded-xl flex-0 items-center justify-center border-2 border-rose-500"
      {...rest}
    >
      <Feather name="trash-2" size={24} color={colors.white} />
    </TouchableOpacity>
  );
}
