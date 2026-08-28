import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';

/** Reset the app navigation stack back to the Sign In screen */
export function navigateToSignIn(navigation: NavigationProp<ParamListBase>) {
  let root: NavigationProp<ParamListBase> | undefined = navigation;
  while (root?.getParent()) {
    root = root.getParent();
  }

  root?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
    })
  );
}
