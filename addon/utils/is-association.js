import { isPlainObject as _isPlainObject } from 'lodash-es';

export default function(object) {
  return _isPlainObject(object) && object.__isAssociation__ === true;
}
