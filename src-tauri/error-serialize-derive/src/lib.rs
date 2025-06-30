use convert_case::{Case, Casing};
use proc_macro2::TokenStream;
use quote::quote;
use syn::{Fields, ItemEnum, Result, parse2};

fn impl_serialize(item: &ItemEnum) -> TokenStream {
    let mut output = TokenStream::new();

    let ident = &item.ident;
    let ident_str = ident.to_string().to_case(Case::UpperCamel);
    let variants = &item.variants;

    for variant in variants {
        let variant_ident = &variant.ident;
        let variant_ident_str = variant_ident.to_string().to_case(Case::Camel);

        match &variant.fields {
            Fields::Unit => {
                output.extend(quote! {
                    #ident::#variant_ident => {
                        ser.serialize_field("kind", #variant_ident_str)?;
                    }
                });
            }
            _ => {
                output.extend(quote! {
                    #ident::#variant_ident(_) => {
                        ser.serialize_field("kind", #variant_ident_str)?;
                    }
                });
            }
        }
    }

    let output = quote! {
        impl ::serde::Serialize for #ident {
            fn serialize<S>(&self, ser: S) -> ::std::result::Result<S::Ok, S::Error>
            where
                S: ::serde::Serializer,
            {
                use ::serde::ser::SerializeStruct;

                let mut ser = ser.serialize_struct(#ident_str, 2)?;

                match self{
                    #output
                }

                ser.serialize_field("message",&self.to_string())?;
                ser.end()
            }
        }
    };

    output
}

fn error_serialize(input: TokenStream) -> Result<TokenStream> {
    let item: ItemEnum = parse2(input)?;
    Ok(impl_serialize(&item))
}

#[proc_macro_derive(ErrorSerialize)]
pub fn error_serialize_derive(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    let input = TokenStream::from(input);
    match error_serialize(input) {
        Ok(output) => output.into(),
        Err(err) => err.to_compile_error().into(),
    }
}
