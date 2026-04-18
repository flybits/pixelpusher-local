import Deferred from "@/models/deferred";

export type PickFileOptions = {
  accept?: string;
  multiple?: boolean;
};

export const pickFile = (opts: PickFileOptions = {}): Promise<FileList | null> => {
  opts = opts || {};
  var def = new Deferred<FileList | null>();
  var $body = document.querySelector('body');
  var $input = document.createElement('input');
  $input.setAttribute('type', 'file');
  $input.style.position = 'absolute';
  $input.style.width = '1px';
  $input.style.height = '1px';
  $input.style.opacity = '0';
  if(opts.accept){
    $input.setAttribute('accept',opts.accept);
  }
  if(opts.multiple){
    $input.setAttribute('multiple', 'multiple');
  }

  $input.addEventListener('change', function(){
    def.resolve(this.files);
    $input.remove();
  });
  $input.addEventListener('cancel', function(){
    def.reject('canceled');
    $input.remove();
  });
  $body?.appendChild($input);
  $input.click();

  return def.promise;
}

export const applyFileExtension = (filename: string, mimeType: string) => {
  const extension = mimeType.split('/')[1];
  return `${filename.split('.')[0]}.${extension}`;
}