import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';

function getRootNavigator(navigation: NavigationProp<ParamListBase>) {
  let root: NavigationProp<ParamListBase> | undefined = navigation;
  while (root?.getParent()) {
    root = root.getParent();
  }
  return root;
}

/** Reset the app navigation stack back to the Sign In screen */
export function navigateToSignIn(navigation: NavigationProp<ParamListBase>) {
  getRootNavigator(navigation)?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
    })
  );
}

/** Lock the app and show MPIN unlock (session stays active). */
export function navigateToMpinLock(navigation: NavigationProp<ParamListBase>) {
  getRootNavigator(navigation)?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'MpinLock' }],
    })
  );
}
