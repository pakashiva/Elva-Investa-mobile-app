import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

export type AddFundsStackParamList = {
  MyInvestments: undefined;
  NewFundRequest: undefined;
  InvestmentDetails: { investmentId: string };
};

export type WithdrawalsStackParamList = {
  WithdrawalsList: undefined;
  CreateWithdrawalRequest: undefined;
  WithdrawalDetails: { withdrawalId: string };
};

export type MoreStackParamList = {
  Menu: undefined;
  MyBankAccounts: undefined;
  AddBankAccount: undefined;
  ReferEarn: undefined;
  MyProfile: undefined;
  Settings: undefined;
  Transactions: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  AddFunds: NavigatorScreenParams<AddFundsStackParamList>;
  Withdrawals: NavigatorScreenParams<WithdrawalsStackParamList>;
  More: NavigatorScreenParams<MoreStackParamList>;
};

export type RootStackParamList = {
  SignIn: undefined;
  CreateAccount: undefined;
  VerifyMobileNumber: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type AddFundsStackScreenProps<T extends keyof AddFundsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AddFundsStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type WithdrawalsStackScreenProps<
  T extends keyof WithdrawalsStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<WithdrawalsStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type MoreStackScreenProps<T extends keyof MoreStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MoreStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
